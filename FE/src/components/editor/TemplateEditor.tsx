import { useState } from 'react';
import { Card, CardTitle, InputField } from '../ui';
import { Bold, Italic, Heading1, Heading2, Link, List, Code2, Type, Columns } from 'lucide-react';
import { cn } from '../../lib/cn';

type EditorTab = 'html' | 'css' | 'settings';

interface Props {
  senderName: string;
  subject: string;
  preheader: string;
  htmlBody: string;
  customCSS: string;
  headers: string[];
  onSenderNameChange: (val: string) => void;
  onSubjectChange: (val: string) => void;
  onPreheaderChange: (val: string) => void;
  onBodyChange: (val: string) => void;
  onCustomCSSChange: (val: string) => void;
  onInsertVariable: (varName: string) => void;
}

function wrapSelection(htmlBody: string, onBodyChange: (v: string) => void, open: string, close: string) {
  const ta = document.getElementById('email-body-editor') as HTMLTextAreaElement;
  if (!ta) return;
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const selected = htmlBody.substring(start, end);
  onBodyChange(htmlBody.substring(0, start) + open + selected + close + htmlBody.substring(end));
  setTimeout(() => { ta.focus(); ta.selectionStart = start + open.length; ta.selectionEnd = start + open.length + selected.length; }, 0);
}

export function TemplateEditor(props: Props) {
  const [activeTab, setActiveTab] = useState<EditorTab>('html');

  const dynamicVars = props.headers.length > 0
    ? props.headers
    : ['Họ Tên', 'SĐT', 'Tên Công Ty', 'Email'];

  return (
    <Card>
      <CardTitle><Code2 size={20} /> Thiết Kế Soạn Thảo Template</CardTitle>

      {props.headers.length > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-mist rounded-xl text-xs text-graphite">
          <Columns size={14} />
          <span>Dữ liệu có các cột: {props.headers.join(', ')}. Dùng {'{{tên_cột}}'} để chèn giá trị động.</span>
        </div>
      )}

      <div className="flex gap-1 border-b border-fog mb-4">
        {(['html', 'css', 'settings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-5 py-2.5 text-sm font-semibold border-none bg-none cursor-pointer inline-flex items-center gap-1.5 transition-all duration-200',
              activeTab === tab ? 'text-midnight-ink border-b-2 border-midnight-ink' : 'text-graphite hover:text-midnight-ink hover:bg-mist',
            )}
          >
            {tab === 'html' && <Type size={14} />}
            {tab === 'css' && <Code2 size={14} />}
            {tab === 'settings'}
            {tab === 'html' ? 'HTML' : tab === 'css' ? 'CSS' : 'Settings'}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {activeTab === 'html' && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-graphite">Nội Dung HTML:</label>
            <div className="flex items-center gap-1 p-2 px-3 border border-fog border-b-0 rounded-t-xl bg-mist flex-wrap">
              <FormatBtn onClick={() => wrapSelection(props.htmlBody, props.onBodyChange, '<strong>', '</strong>')} title="Bold"><Bold size={14} /></FormatBtn>
              <FormatBtn onClick={() => wrapSelection(props.htmlBody, props.onBodyChange, '<em>', '</em>')} title="Italic"><Italic size={14} /></FormatBtn>
              <Div />
              <FormatBtn onClick={() => wrapSelection(props.htmlBody, props.onBodyChange, '<h1>', '</h1>')} title="Heading 1"><Heading1 size={14} /></FormatBtn>
              <FormatBtn onClick={() => wrapSelection(props.htmlBody, props.onBodyChange, '<h2>', '</h2>')} title="Heading 2"><Heading2 size={14} /></FormatBtn>
              <Div />
              <FormatBtn onClick={() => wrapSelection(props.htmlBody, props.onBodyChange, '<a href="#">', '</a>')} title="Link"><Link size={14} /></FormatBtn>
              <FormatBtn onClick={() => wrapSelection(props.htmlBody, props.onBodyChange, '<li>', '</li>')} title="List"><List size={14} /></FormatBtn>
              <Div />
              <FormatBtn onClick={() => wrapSelection(props.htmlBody, props.onBodyChange, '<p>', '</p>')}>P</FormatBtn>
              <FormatBtn onClick={() => wrapSelection(props.htmlBody, props.onBodyChange, '<br>\n', '')}>BR</FormatBtn>
              <Div />
              {dynamicVars.map(v => (
                <FormatBtn key={v} onClick={() => props.onInsertVariable(v)}>{`{{${v}}}`}</FormatBtn>
              ))}
            </div>
            <textarea
              id="email-body-editor"
              value={props.htmlBody}
              onChange={(e) => props.onBodyChange(e.target.value)}
              placeholder="<html>...viết HTML của bạn ở đây...</html>"
              spellCheck={false}
              className="w-full min-h-[360px] p-4 border border-fog rounded-b-xl text-sm font-mono leading-relaxed outline-none resize-y transition-all duration-200 text-midnight-ink tab-size-2 focus:border-midnight-ink"
            />
          </div>
        )}

        {activeTab === 'css' && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-graphite">Tuỳ Chỉnh CSS:</label>
            <span className="text-[11px] text-graphite -mt-1">CSS inline sẽ được nhúng vào &lt;head&gt; của email.</span>
            <div className="flex items-center gap-1 p-2 px-3 border border-fog rounded-xl bg-mist flex-wrap mb-2">
              {dynamicVars.map(v => (
                <FormatBtn key={v} onClick={() => {
                  const ta = document.getElementById('css-editor') as HTMLTextAreaElement;
                  if (!ta) return;
                  const start = ta.selectionStart;
                  const end = ta.selectionEnd;
                  props.onCustomCSSChange(props.customCSS.substring(0, start) + `{{${v}}}` + props.customCSS.substring(end));
                  setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + v.length + 4; }, 0);
                }}>{`{{${v}}}`}</FormatBtn>
              ))}
            </div>
            <textarea
              id="css-editor"
              value={props.customCSS}
              onChange={(e) => props.onCustomCSSChange(e.target.value)}
              placeholder="/* Viết CSS của bạn ở đây */"
              spellCheck={false}
              wrap="off"
              className="w-full min-h-[360px] p-4 border border-fog rounded-xl text-sm font-mono leading-relaxed outline-none resize-y transition-all duration-200 bg-midnight-ink text-white tab-size-2 focus:border-midnight-ink placeholder-ash"
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-graphite">Tên Người Gửi (Sender Name):</label>
              <InputField value={props.senderName} onChange={(e) => props.onSenderNameChange(e.target.value)} placeholder="Hiển thị tên người gửi..." />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-graphite">Tiêu Đề Email (Subject Line):</label>
              <InputField value={props.subject} onChange={(e) => props.onSubjectChange(e.target.value)} placeholder="Dòng tiêu đề..." />
              <span className="text-[11px] text-graphite">Sử dụng biến: {dynamicVars.map(v => `{{${v}}}`).join(', ')}</span>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-graphite">Preheader Text (Đoạn mô tả ngắn):</label>
              <InputField value={props.preheader} onChange={(e) => props.onPreheaderChange(e.target.value)} placeholder="Hiển thị sau subject trong hộp thư đến..." />
              <span className="text-[11px] text-graphite">Preheader là đoạn text hiển thị bên cạnh subject trong inbox. Tối đa 100 ký tự.</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function FormatBtn({ onClick, title, children }: { onClick: () => void; title?: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="px-2 py-1.5 rounded-md text-xs font-medium bg-transparent border border-transparent text-midnight-ink cursor-pointer inline-flex items-center gap-1 hover:bg-white hover:border-fog"
    >
      {children}
    </button>
  );
}

function Div() {
  return <div className="w-px h-5 bg-silver mx-1" />;
}
