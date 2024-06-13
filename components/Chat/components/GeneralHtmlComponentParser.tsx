import React from 'react';

// NOTE: THE COMPONENT IS USED FOR STATIC HTML GENERATION, SO DON'T USE HOOKS OR STATE

const GeneralHtmlComponentParser = ({
  id,
  componentState,
  identifier = undefined,
}: {
  id: string;
  componentState: object;
  identifier?: string | undefined;
}) => {
  return (
    <div
      id={id}
      data-component-state={JSON.stringify(componentState)}
      data-identifier={identifier}
    ></div>
  );
};

export default GeneralHtmlComponentParser;
