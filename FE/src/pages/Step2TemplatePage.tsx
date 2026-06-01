import { TemplateEditor } from '../components/editor/TemplateEditor';
import { GmailPreview } from '../components/editor/GmailPreview';

interface Props {
  senderName: string;
  subject: string;
  preheader: string;
  htmlBody: string;
  customCSS: string;
  userEmail: string;
  headers: string[];
  onSenderNameChange: (val: string) => void;
  onSubjectChange: (val: string) => void;
  onPreheaderChange: (val: string) => void;
  onBodyChange: (val: string) => void;
  onCustomCSSChange: (val: string) => void;
  onInsertVariable: (varName: string) => void;
}

export function Step2TemplatePage(props: Props) {
  return (
    <div className="grid grid-cols-2 gap-8 items-start max-lg:grid-cols-1">
      <TemplateEditor
        senderName={props.senderName}
        subject={props.subject}
        preheader={props.preheader}
        htmlBody={props.htmlBody}
        customCSS={props.customCSS}
        headers={props.headers}
        onSenderNameChange={props.onSenderNameChange}
        onSubjectChange={props.onSubjectChange}
        onPreheaderChange={props.onPreheaderChange}
        onBodyChange={props.onBodyChange}
        onCustomCSSChange={props.onCustomCSSChange}
        onInsertVariable={props.onInsertVariable}
      />
      <GmailPreview
        senderName={props.senderName}
        subject={props.subject}
        preheader={props.preheader}
        htmlBody={props.htmlBody}
        customCSS={props.customCSS}
        userEmail={props.userEmail}
      />
    </div>
  );
}
