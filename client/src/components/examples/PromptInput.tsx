import PromptInput from '../PromptInput';

export default function PromptInputExample() {
  return (
    <PromptInput 
      onGenerate={(prompt, template) => console.log('Generate:', { prompt, template })}
    />
  );
}
