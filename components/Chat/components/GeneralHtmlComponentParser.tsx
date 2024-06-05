import React from 'react';

// NOTE: THE COMPONENT IS USED FOR STATIC HTML GENERATION, SO DON'T USE HOOKS OR STATE

const GeneralHtmlComponentParser = ({
  id,
  componentState,
}: {
  id: string;
  componentState: object;
}) => {
  return (
    <div id={id} data-component-state={JSON.stringify(componentState)}></div>
  );
};

export default GeneralHtmlComponentParser;
