import { API_CONFIG } from '../utils/constants.js';
import { apiClient } from './api.js';

/**
 * Participants Service
 * Handles all participant-related API operations
 * 
 * IMPORTANT: Backend expects linking existing users by userId (USR-prefixed ID)
 * NOT creating new participant profiles
 * 
 * Backend Endpoints:
 * POST   /participants/create/:entityType/:meetingId
 * GET    /participants/list/:entityType/:meetingId
 * GET    /participants/get/:entityType/:participantId
 * PATCH  /participants/update/:entityType/:participantId
 * DELETE /participants/delete/:entityType/:participantId
 */
export const participantsService = {
  /**
   * Add participant to meeting
   * Backend: POST /participants/create/:entityType/:meetingId
   * Response structure: {success: true, data: {participant: {...}}}
   * REQUIRED FIELDS: userId (USR-prefixed custom user ID)
   * OPTIONAL FIELDS: roleDescription
   */
  async addParticipant(entityType, meetingId, participantData) {
    // Backend expects: { userId: "USR1100000", roleDescription?: "SCRIBE" }
    const normalizedData = {
      userId: participantData.userId,  // REQUIRED - USR-prefixed ID like "USR1100000"
      ...(participantData.roleDescription && { roleDescription: participantData.roleDescription })
    };

    const response = await apiClient.post(
      `${API_CONFIG.ENDPOINTS.PARTICIPANTS}/add/${entityType}/${meetingId}`,
      normalizedData
    );
    
    // Backend returns: {data: {participant: {...}}}
    response.data = response.data?.participant || response.data;
    return response;
  },

  /**
   * List all participants for a meeting
   * Backend: GET /participants/list/:entityType/:meetingId
   * Response structure: {success: true, data: {participants: [...], pagination: {...}}}
   * NOTE: meetingId must be a valid MongoDB ObjectId, cannot be 'all'
   */
  async listParticipants(entityType = 'inceptions', meetingId = null) {
    // If no meetingId provided, return empty array - user must select a specific meeting
    if (!meetingId) {
      console.warn('⚠️ No meetingId provided to listParticipants - returning empty array');
      return [];
    }

    try {
      console.log(`🔄 [participantsService.listParticipants] Fetching: /participants/list/${entityType}/${meetingId}`);
      
      const response = await apiClient.get(
        `${API_CONFIG.ENDPOINTS.PARTICIPANTS}/list/${entityType}/${meetingId}`
      );
      
      console.log(`📨 [participantsService] Full response:`, response);
      
      if (!response.success) {
        console.warn('⚠️ [participantsService] API returned success:false', response.message);
        return [];
      }
      
      // Debug: Log the entire data structure
      console.log(`📦 [participantsService] response.data:`, response.data);
      console.log(`📦 [participantsService] response.data.participants:`, response.data?.participants);
      console.log(`📦 [participantsService] response.data.data:`, response.data?.data);
      
      // Support multiple response structures from backend
      let participants = response.data?.participants || 
                         response.data?.data?.participants || 
                         response.data?.data || 
                         response.data || 
                         [];
      
      console.log(`✅ [participantsService] Extracted participants:`, participants);
      
      return Array.isArray(participants) ? participants : [];
    } catch (error) {
      console.error('❌ [participantsService] Failed to fetch participants:', error);
      return [];
    }
  },

  /**
   * Get single participant details
   * Backend: GET /participants/get/:entityType/:meetingId/:participantId
   * Response structure: {success: true, data: {participant: {...}}}
   * NOTE: Backend requires meetingId in the path
   */
  async getParticipant(entityType, meetingId, participantId) {
    const response = await apiClient.get(
      `${API_CONFIG.ENDPOINTS.PARTICIPANTS}/get/${entityType}/${meetingId}/${participantId}`
    );
    
    // Backend returns: {data: {participant: {...}}}
    response.data = response.data?.participant || response.data;
    return response;
  },

  /**
   * Update participant
   * Backend: PATCH /participants/update/:entityType/:meetingId
   * Response structure: {success: true, data: {participant: {...}}}
   * REQUIRED FIELDS: userId
   * OPTIONAL FIELDS: roleDescription
   * NOTE: Backend expects meetingId in path, userId in body
   */
  async updateParticipant(entityType, meetingId, participantData) {
    const normalizedData = {
      userId: participantData.userId,  // REQUIRED
      ...(participantData.roleDescription && { roleDescription: participantData.roleDescription })
    };

    const response = await apiClient.patch(
      `${API_CONFIG.ENDPOINTS.PARTICIPANTS}/update/${entityType}/${meetingId}`,
      normalizedData
    );
    
    // Backend returns: {data: {participant: {...}}}
    response.data = response.data?.participant || response.data;
    return response;
  },

  /**
   * Remove participant from meeting
   * Backend: PATCH /participants/remove/:entityType/:meetingId
   * Response structure: {success: true, data: {participant: {...}}}
   * REQUIRED FIELDS: userId
   * OPTIONAL FIELDS: removeReason
   * NOTE: Backend expects meetingId in path, userId in body
   */
  async removeParticipant(entityType, meetingId, participantData) {
    console.log(`🔄 [participantsService.removeParticipant] Input data:`, participantData);
    
    const removeData = {
      userId: participantData.userId,  // REQUIRED
      ...(participantData.removeReason && { removeReason: participantData.removeReason })
    };

    console.log(`📤 [participantsService.removeParticipant] Sending data:`, removeData);
    console.log(`📤 [participantsService.removeParticipant] Path: /participants/remove/${entityType}/${meetingId}`);

    const response = await apiClient.patch(
      `${API_CONFIG.ENDPOINTS.PARTICIPANTS}/remove/${entityType}/${meetingId}`,
      removeData
    );
    
    console.log(`✅ [participantsService.removeParticipant] Response:`, response);
    
    // Backend returns: {data: {participant: {...}}}
    response.data = response.data?.participant || response.data;
    return response;
    return response;
  }
};
