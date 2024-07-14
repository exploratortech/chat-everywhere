// This is a handler to execute and return the result of a function call to LLM.
// This would seat between the endpoint and LLM.
import { DEFAULT_SYSTEM_PROMPT, RESPONSE_IN_CHINESE_PROMPT } from '@/utils/app/const';
import { AIStream } from '@/utils/server/functionCalls/AIStream';
import { triggerHelperFunction } from '@/utils/server/functionCalls/llmHandlerHelpers';

import { FunctionCall, Message } from '@/types/chat';
import { UserProfile } from '@/types/user';

type handlerType = {
  user: UserProfile;
  messages: Message[];
  countryCode: string;
  prompt: string;
  onUpdate: (payload: string) => void;
  onProgressUpdate: (payload: { content: string; type: string }) => void;
  onErrorUpdate: (payload: string) => void;
  onEnd: () => void;
};

let llmHandlerPrompt =
  DEFAULT_SYSTEM_PROMPT +
  `Your main task is to process image generation tasks, utilizing the generate-image function. Below is the pseudo-code for you to follow:
def ImageGenerationTask(request):
# Extract user input
user_input = request.user_input

    # Check if user requested modifications to an existing image
    if request.is_modification_request:
        # Retrieve the original prompt from the 'alt' attribute of the image tag
        original_prompt = get_prompt_from_image_tag(request.image_tag)
        
        # Adjust the prompt based on user's modification request
        modified_prompt = adjust_prompt(original_prompt, user_input)
        
        # Generate a new image with the modified prompt
        image = generate_image(modified_prompt, style_base)
    
    # Check if user asked for the prompt used to generate a specific image
    elif request.is_prompt_request:
        # Retrieve the prompt from the 'alt' attribute of the image tag
        prompt = get_prompt_from_image_tag(request.image_tag)
        
        # Return the prompt to the user
        return prompt
    
    # Default case: Generate a new image based on user input
    else:
        # Use the user input as the image prompt
        image_prompt = user_input
        
        # Generate the image
        image = generate_image(image_prompt, style_base)
    
    # Check if image generation was successful
    if image is None:
        # Inform the user about the failure and its reason
        return "Image generation failed. Reason: " + get_failure_reason()
    else:
        # Return the generated image
        return image

def generate_image(image_prompt, style_base):
# Supplement the image prompt and style base
final_prompt = supplement_prompt(image_prompt, style_base)

    # Set the random seed value to 42
    set_random_seed(42)
    
    # Generate the image using the final prompt
    image = invoke_generate_image_function(final_prompt)
    
    # Ensure no text appears in the image
    remove_text_from_image(image)
    
    return image

def supplement_prompt(image_prompt, style_base):
# Add tone, background description, specific style, picture details
supplemented_prompt = add_details_to_prompt(image_prompt, style_base)

    # Include at least 3 effect words
    supplemented_prompt = add_effect_words(supplemented_prompt, min_count=3)
    
    # Include more than 1 composition technique
    supplemented_prompt = add_composition_techniques(supplemented_prompt, min_count=2)
    
    return supplemented_prompt

def generate_html_for_ai_painter_images():
# call the 'generate-html-for-ai-painter-images' function
# End the conversation immediately and say nothing more
end_conversation()
  `;

export const aiPainterLlmHandler = async ({
  user,
  messages,
  countryCode,
  prompt,
  onUpdate,
  onProgressUpdate,
  onErrorUpdate,
  onEnd,
}: handlerType) => {
  if (countryCode?.includes('TW')) {
    llmHandlerPrompt += RESPONSE_IN_CHINESE_PROMPT
  }
  const functionCallsToSend: FunctionCall[] = [
    {
      name: 'generate-html-for-ai-painter-images',
      description: 'To show the result of the image generation',
      parameters: {
        type: 'object',
        properties: {
          imageResults: {
            type: 'array',
            description: 'The result of the image generation',
            items: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'The url of the image',
                },
                prompt: {
                  type: 'string',
                  description: 'The prompt of the image',
                },
                filename: {
                  type: 'string',
                  description: 'The file name of the image',
                },
              },
            },
          },
        },
      },
    },
    {
      name: 'generate-image',
      description: 'Generate an image from a prompt',
      parameters: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'Prompt to generate the image. MUST BE IN ENGLISH.',
          },
        },
      },
    }
  ];
  let isFunctionCallRequired = true;
  let innerWorkingMessages = messages;

  try {
    while (isFunctionCallRequired) {
      const requestedFunctionCalls = await AIStream({
        countryCode: countryCode,
        systemPrompt: llmHandlerPrompt + prompt,
        messages: innerWorkingMessages,
        onUpdateToken: (token: string) => {
          onUpdate(token);
        },
        functionCalls: functionCallsToSend,
      });

      // No function call required, exiting
      if (requestedFunctionCalls.length === 0) {
        isFunctionCallRequired = false;
        break;
      }

      // Function call required, executing
      for (const functionCall of requestedFunctionCalls) {
        let executionResult: string;

        // Execute helper function
        if (functionCall.name === 'generate-image') {
          onProgressUpdate({
            content: 'Creating artwork...🎨',
            type: 'progress',
          });
        }

        const helperFunctionResult = await triggerHelperFunction(
          functionCall.name,
          functionCall.arguments,
          user.id,
          onProgressUpdate,
          user,
        );

        if (functionCall.name === 'generate-image') {
          onProgressUpdate({
            content: 'Ready to show you...💌',
            type: 'progress',
          });
          // remove the 'generate-image' function call from the function calls list to avoid its being called again
          functionCallsToSend.pop();
        }
        executionResult = helperFunctionResult;

        innerWorkingMessages.push({
          role: 'function',
          name: functionCall.name,
          content: `function name '${functionCall.name}'s execution result: ${executionResult}`,
          pluginId: null,
        });
      }
    }
  } catch (err) {
    if (err instanceof Error && err.cause) {
      const errorMessage =
        (err.cause as { message?: string })?.message || err.message;
      onErrorUpdate(errorMessage);
    } else {
      onErrorUpdate('An error occurred, please try again.');
    }
    console.error(err);
  } finally {
    onEnd();
  }
};
