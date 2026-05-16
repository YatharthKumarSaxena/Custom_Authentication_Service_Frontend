/**
 * Ideas Service
 * Manages all API calls for the Ideas module
 * Backend Base: /ideas
 */

import apiClient from './api.js';
import { API_CONFIG } from '../utils/constants.js';

class IdeasService {
  normalizeIdea(idea) {
    if (!idea) return null;

    const normalizedId = idea._id || idea.ideaId || idea.id;

    return {
      ...idea,
      _id: normalizedId,
      id: normalizedId
    };
  }

  normalizeList(response) {
    const payload = response?.data;
    const ideas = payload?.data?.ideas || payload?.data?.items || payload?.ideas || payload?.items || payload?.data || payload || [];
    return Array.isArray(ideas) ? ideas.map((idea) => this.normalizeIdea(idea)) : [];
  }

  /**
   * Create a new idea
   * Backend: POST /ideas/create/:projectId
   */
  async createIdea(projectId, ideaData = {}) {
    return apiClient.post(
      `${API_CONFIG.ENDPOINTS.IDEAS}/create/${projectId}`,
      {
        title: ideaData.title,
        description: ideaData.description
      }
    );
  }

  /**
   * Get list of ideas for a project
   * Backend: GET /ideas/list/:projectId
   */
  async listIdeas(projectId, filters = {}) {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.status) params.append('status', filters.status);
    
    const url = `${API_CONFIG.ENDPOINTS.IDEAS}/list/${projectId}${params.toString() ? '?' + params.toString() : ''}`;
    return apiClient.get(url);
  }

  /**
   * Get a single idea by ID
   * Backend: GET /ideas/get/:ideaId
   */
  async getIdea(ideaId) {
    return apiClient.get(`${API_CONFIG.ENDPOINTS.IDEAS}/get/${ideaId}`);
  }

  /**
   * Update an idea
   * Backend: PATCH /ideas/update/:ideaId
   */
  async updateIdea(ideaId, updateData = {}) {
    return apiClient.patch(
      `${API_CONFIG.ENDPOINTS.IDEAS}/update/${ideaId}`,
      {
        title: updateData.title,
        description: updateData.description
      }
    );
  }

  /**
   * Delete an idea
   * Backend: DELETE /ideas/delete/:ideaId
   */
  async deleteIdea(ideaId, deleteData = {}) {
    return apiClient.delete(
      `${API_CONFIG.ENDPOINTS.IDEAS}/delete/${ideaId}`,
      {
        deletionReasonType: deleteData.deletionReasonType,
        deletionReasonDescription: deleteData.deletionReasonDescription || undefined
      }
    );
  }

  /**
   * Accept an idea
   * Backend: PATCH /ideas/accept/:ideaId
   */
  async acceptIdea(ideaId) {
    return apiClient.patch(
      `${API_CONFIG.ENDPOINTS.IDEAS}/accept/${ideaId}`,
      {}
    );
  }

  /**
   * Reject an idea with reason
   * Backend: PATCH /ideas/reject/:ideaId
   */
  async rejectIdea(ideaId, rejectData = {}) {
    return apiClient.patch(
      `${API_CONFIG.ENDPOINTS.IDEAS}/reject/${ideaId}`,
      {
        rejectionReasonType: rejectData.rejectionReasonType,
        rejectionReasonDescription: rejectData.rejectionReasonDescription || undefined
      }
    );
  }

  /**
   * Defer an idea with reason
   * Backend: PATCH /ideas/defer/:ideaId
   */
  async deferIdea(ideaId, deferData = {}) {
    return apiClient.patch(
      `${API_CONFIG.ENDPOINTS.IDEAS}/defer/${ideaId}`,
      {
        deferralReasonType: deferData.deferralReasonType,
        deferralReasonDescription: deferData.deferralReasonDescription || undefined
      }
    );
  }

  /**
   * Reopen an idea
   * Backend: PATCH /ideas/reopen/:ideaId
   */
  async reopenIdea(ideaId) {
    return apiClient.patch(
      `${API_CONFIG.ENDPOINTS.IDEAS}/reopen/${ideaId}`,
      {}
    );
  }
}

export const ideasService = new IdeasService();
