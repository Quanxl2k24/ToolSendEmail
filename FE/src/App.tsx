import { useState, useCallback } from "react";
import { Edit2 } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { useCampaign } from "./hooks/useCampaign";
import { useRecipients } from "./hooks/useRecipients";
import { useSendingEngine } from "./hooks/useSendingEngine";
import type { CampaignSendData } from "./hooks/useSendingEngine";
import { LoginPage } from "./components/auth/LoginPage";
import { Sidebar, TopBar, WizardFooter } from "./components/layout";
import { CampaignStepper } from "./components/stepper/CampaignStepper";
import { EditableInput } from "./components/ui";
import { Step1SetupPage } from "./pages/Step1SetupPage";
import { Step2TemplatePage } from "./pages/Step2TemplatePage";
import { Step3ValidationPage } from "./pages/Step3ValidationPage";
import { Step4SendPage } from "./pages/Step4SendPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CampaignDetailPage } from "./pages/CampaignDetailPage";

type Page = "dashboard" | "wizard" | "detail";

const pageTitles: Record<Page, string> = {
  dashboard: "Dashboard Chiến dịch",
  wizard: "Tạo chiến dịch mới",
  detail: "Chi tiết chiến dịch",
};

export default function App() {
  const { user, loading, error: authError, signIn, signOut } = useAuth();
  const campaign = useCampaign();
  const recipients = useRecipients();
  const engine = useSendingEngine();

  const [page, setPage] = useState<Page>("dashboard");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null,
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSignOut = useCallback(() => {
    signOut();
    campaign.reset();
    recipients.resetRecipients();
    engine.resetSending();
  }, [signOut, campaign, recipients, engine]);

  const goToDashboard = useCallback(() => setPage("dashboard"), []);

  const goToWizard = useCallback(() => {
    campaign.reset();
    recipients.resetRecipients();
    engine.resetSending();
    setPage("wizard");
  }, [campaign, recipients, engine]);

  const goToDetail = useCallback((id: string) => {
    setSelectedCampaignId(id);
    setPage("detail");
  }, []);

  const handleInsertVariable = useCallback(
    (variable: string) => {
      const ta = document.getElementById(
        "email-body-editor",
      ) as HTMLTextAreaElement;
      if (ta) {
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        campaign.setHtmlBody(
          campaign.htmlBody.substring(0, start) +
            `{{${variable}}}` +
            campaign.htmlBody.substring(end),
        );
        setTimeout(() => {
          ta.focus();
          ta.selectionStart = ta.selectionEnd = start + variable.length + 4;
        }, 0);
      }
    },
    [campaign],
  );

  const handleNext = useCallback(() => {
    if (campaign.step === 1 && !recipients.fileUploaded) {
      alert("Vui lòng tải lên file dữ liệu hoặc kết nối Google Sheet trước!");
      return;
    }
    campaign.goNext();
  }, [campaign, recipients.fileUploaded]);

  const handleStartSending = useCallback(() => {
    const data: CampaignSendData = {
      name: campaign.name,
      subject: campaign.subject,
      htmlBody: campaign.htmlBody,
      file: recipients.uploadedFile,
      googleSheetUrl: recipients.googleSheetLink,
      emailColumn: recipients.emailColumn,
    };
    engine.startSending(data);
  }, [campaign, recipients, engine]);

  const handleWizardReset = useCallback(() => {
    campaign.goTo(1);
    engine.resetSending();
  }, [campaign, engine]);

  if (!user)
    return <LoginPage loading={loading} error={authError} onSignIn={signIn} />;

  return (
    <div className="min-h-screen bg-white text-midnight-ink font-sans flex">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((p) => !p)}
        activePage={page}
        onGoToDashboard={goToDashboard}
        onGoToWizard={goToWizard}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          title={pageTitles[page]}
          user={user}
          onSignOut={handleSignOut}
        />

        <div className="flex-1 w-[1200px] mx-auto pb-[100px] pt-8 overflow-y-auto max-md:px-5 max-md:pb-20 max-md:pt-6">
          {page === "dashboard" && (
            <DashboardPage
              onNewCampaign={goToWizard}
              onViewDetail={goToDetail}
            />
          )}

          {page === "detail" && selectedCampaignId && (
            <CampaignDetailPage
              campaignId={selectedCampaignId}
              onBack={goToDashboard}
            />
          )}

          {page === "wizard" && (
            <>
              <CampaignStepper
                current={campaign.step}
                hidden={campaign.step === 4}
              />
              {campaign.step !== 4 && (
                <div className="flex items-center gap-3 mb-8">
                  <EditableInput
                    value={campaign.name}
                    onChange={(e) => campaign.setName(e.target.value)}
                    placeholder="Tên chiến dịch email"
                    title="Click để đổi tên chiến dịch"
                  />
                  <Edit2
                    size={16}
                    color="#707070"
                    style={{ cursor: "pointer" }}
                  />
                </div>
              )}

              {campaign.step === 1 && (
                <Step1SetupPage
                  fileUploaded={recipients.fileUploaded}
                  fileName={recipients.fileName}
                  googleSheetLink={recipients.googleSheetLink}
                  recipientCount={recipients.recipientCount}
                  loading={recipients.loading}
                  error={recipients.error}
                  emailColumn={recipients.emailColumn}
                  sheetPreview={recipients.sheetPreview}
                  onFileUpload={recipients.handleFileUpload}
                  onGoogleSheetLinkChange={recipients.setGoogleSheetLink}
                  onConnectGoogleSheet={recipients.handleConnectGoogleSheet}
                  onEmailColumnChange={recipients.setEmailColumn}
                />
              )}
              {campaign.step === 2 && (
                <Step2TemplatePage
                  senderName={campaign.senderName}
                  subject={campaign.subject}
                  preheader={campaign.preheader}
                  htmlBody={campaign.htmlBody}
                  customCSS={campaign.customCSS}
                  userEmail={user.email}
                  headers={recipients.sheetPreview?.headers ?? []}
                  onSenderNameChange={campaign.setSenderName}
                  onSubjectChange={campaign.setSubject}
                  onPreheaderChange={campaign.setPreheader}
                  onBodyChange={campaign.setHtmlBody}
                  onCustomCSSChange={campaign.setCustomCSS}
                  onInsertVariable={handleInsertVariable}
                />
              )}
              {campaign.step === 3 && (
                <Step3ValidationPage
                  fileName={recipients.fileName}
                  fileUploaded={recipients.fileUploaded}
                  googleSheetLink={recipients.googleSheetLink}
                  recipientCount={recipients.recipientCount}
                  campaignName={campaign.name}
                  subject={campaign.subject}
                />
              )}
              {campaign.step === 4 && (
                <Step4SendPage
                  totalCount={engine.totalCount}
                  successCount={engine.successCount}
                  failedCount={engine.failedCount}
                  progress={engine.progress}
                  isSending={engine.isSending}
                  logs={engine.logs}
                  error={engine.error}
                  campaignId={engine.campaignId}
                  onStart={handleStartSending}
                  onStop={engine.stopSending}
                  onReset={handleWizardReset}
                  onViewDetail={goToDetail}
                />
              )}
            </>
          )}
        </div>

        {page === "wizard" && (
          <WizardFooter
            step={campaign.step}
            hasData={recipients.fileUploaded}
            onBack={campaign.goBack}
            onNext={handleNext}
            onReset={handleWizardReset}
          />
        )}
      </div>
    </div>
  );
}
