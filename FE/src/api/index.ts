export { api, ApiError } from './client';
export {
  listCampaigns,
  sendCampaign,
  cancelCampaign,
  getMailLogs,
} from './campaigns';
export type { SendCampaignPayload } from './campaigns';
export {
  connectSocket,
  disconnectSocket,
  joinCampaign,
  leaveCampaign,
  onProgressUpdate,
  getSocket,
} from './socket';
