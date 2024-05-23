# Chat Everywhere by [Explorator Labs](https://exploratorlabs.com)

[中文版](https://intro.chateverywhere.app/README-zh.html)

Chat Everywhere is an app designed to showcase the capabilities of Large Language Models and make them accessible to everyone without login or geo-restrictions. Our community has contributed valuable feedback during the app's development, resulting in additional features not found in the official ChatGPT.

## Additional Features
- Folder structures
- Prompt templates
- Import/Export conversations
- Delete message
- Multi language support
> ^Thanks to the [open-source community](https://github.com/mckaywrigley/chatbot-ui)
- Share conversations
- Internet connected enhance mode (Beta)
- Respond Language selection (Coming up)
- Store conversations (Coming up)

## Origins

This project is forked from [Chatbot UI](https://github.com/mckaywrigley/chatbot-ui), an initiative by [Mckay](https://twitter.com/mckaywrigley) to build a superior and open-source user interface compared to the official one.

## Project Funding plan

[Explorator Labs](https://exploratorlabs.com) is committed to lowering barriers to accessing technology like ChatGPT by pledging a fixed monthly budget, making this project available without the need for login or payment.

As the popularity of Chat Everywhere has grown, we are facing challenges in covering the increased costs, which now exceed USD $2k per month. In the coming weeks, we will introduce a paid account feature to support the project's sustainability and enable us to develop more advanced functionalities for all users!

## Tech Stack

- [React.js](https://react.dev/)
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [LangChainJS](https://js.langchain.com)
- [Vercel](https://vercel.com/)

## Getting Started (Work in progress)

**1. Clone Repo**

```bash
git clone https://github.com/exploratortech/chat-everywhere
```

**2. Install Dependencies**

```bash
npm i
```

**3. Provide OpenAI API Key**

Create a .env.local file in the root of the repo with your OpenAI API Key:

```bash
OPENAI_API_KEY=YOUR_KEY
```

**4. Run App**

```bash
npm run dev
```

**5. Use It**

Start chatting and enjoy!


# Set up the web browser tool endpoint for Online mode (Work in progress)

1. Ensure that the environment variable `WEB_CONTENT_FUNCTION_SECRET` is set in the project's root folder and in `./firebase/functions/`.
2. Deploy the Firebase functions using `npm run deploy`.
3. Update the `WEB_CONTENT_FUNCTION_ENDPOINT` after completing the initial deployment.

# Set up `ai-images` bucket for AI Painter feature for Local development

1. Create a supabase bucket `ai-images` and make it public in the Local supabase server.

# Set up image-to-prompt feature bucket for Local development

1. Create a supabase bucket `image-to-prompt` and make it public in the Local supabase server.
2. Go to file `pages/api/image-to-prompt.ts` and uncomment the function `replaceLocalhost`
3. Update the variable `ngrokHost ` and `localSupabaseHost`
4. Uncomment the line where url is passed to `url: replaceLocalhost(url)`, in function `nextLegDescribe`
5. Now that your supabase bucket is accessible from the internet, so that the next leg api can access it.

# Set up the Teacher Portal for Local development
1. Create a supabase bucket `student_message_submissions_image` and make it public in the Local supabase server.


# Database migration guide
1. Make the changes in local Supabase emulator
2. Generate a new migration file with `supabase migration new migration_file_name`
3. Get database difference with `supabase db diff`
4. Apply appropriate changes to the new migration file