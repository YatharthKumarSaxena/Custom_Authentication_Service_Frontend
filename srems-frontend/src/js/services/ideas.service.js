/**
 * ideas.service.js
 * Ideas management operations
 * 
 * Backend Endpoints:
 * POST   /ideas/create/:projectId
 * GET    /ideas/list/:projectId
 * GET    /ideas/get/:ideaId
 * PATCH  /ideas/update/:ideaId
 * PATCH  /ideas/accept/:ideaId
 * PATCH  /ideas/reject/:ideaId
 * PATCH  /ideas/defer/:ideaId
 * PATCH  /ideas/reopen/:ideaId
 * DELETE /ideas/delete/:ideaId
 */

import apiClient from './api.js';
import { API_CONFIG } from '../utils/constants.js';

class IdeasService {
  /**
   * Create new idea
   * Backend: POST /ideas/create/:projectId
   * REQUIRED FIELDS: title, description
   */
  async createIdea(projectId, ideaData) {
    try {
      const response = await apiClient.post(
        `${API_CONFIG.ENDPOINTS.IDEAS}/create/${projectId}`,
        ideaData
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create idea');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to create idea:', error);
      throw error;
    }
  }

  /**
   * Get all ideas for a project
   * Backend: GET /ideas/list/:projectId
   */
  async getIdeas(projectId, page = 1, pageSize = 10) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required to fetch ideas');
      }

      const response = await apiClient.get(
        `${API_CONFIG.ENDPOINTS.IDEAS}/list/${projectId}?page=${page}&pageSize=${pageSize}`
      );
      
      if (!response.success) {
        return [];
      }
      
      return Array.isArray(response.data?.data?.ideas) ? response.data.data.ideas : 
             Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Failed to fetch ideas:', error);
      return [];
    }
  }

  /**
   * Get single idea by ID
   * Backend: GET /ideas/get/:ideaId
   */
  async getIdea(ideaId) {
    try {
      if (!ideaId) {
        throw new Error('Idea ID is required');
      }

      const response = await apiClient.get(
        `${API_CONFIG.ENDPOINTS.IDEAS}/get/${ideaId}`
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch idea');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to fetch idea:', error);
      throw error;
    }
  }

  /**
   * Update idea
   * Backend: PATCH /ideas/update/:ideaId
   * OPTIONAL FIELDS: title, description
   */
  async updateIdea(ideaId, ideaData) {
    try {
      const response = await apiClient.patch(
        `${API_CONFIG.ENDPOINTS.IDEAS}/update/${ideaId}`,
        ideaData
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update idea');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to update idea:', error);
      throw error;
    }
  }

  /**
   * Accept idea (change status from PENDING to ACCEPTED)
   * Backend: PATCH /ideas/accept/:ideaId
   */
  async acceptIdea(ideaId) {
    try {
      const response = await apiClient.patch(
        `${API_CONFIG.ENDPOINTS.IDEAS}/accept/${ideaId}`,
        {}
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to accept idea');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to accept idea:', error);
      throw error;
    }
  }

  /**
   * Reject idea with reason (change status from PENDING to REJECTED)
   * Backend: PATCH /ideas/reject/:ideaId
   * REQUIRED FIELDS: rejectReason
   * OPTIONAL FIELDS: rejectDescription
   */
  async rejectIdea(ideaId, rejectData = {}) {
    try {
      const response = await apiClient.patch(
        `${API_CONFIG.ENDPOINTS.IDEAS}/reject/${ideaId}`,
        rejectData
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to reject idea');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to reject idea:', error);
      throw error;
    }
  }

  /**
   * Defer idea with reason (change status from PENDING to DEFERRED)
   * Backend: PATCH /ideas/defer/:ideaId
   * REQUIRED FIELDS: deferReason
   * OPTIONAL FIELDS: deferDescription
   */
  async deferIdea(ideaId, deferData = {}) {
    try {
      const response = await apiClient.patch(
        `${API_CONFIG.ENDPOINTS.IDEAS}/defer/${ideaId}`,
        deferData
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to defer idea');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to defer idea:', error);
      throw error;
    }
  }

  /**
   * Reopen idea (change status from REJECTED/DEFERRED back to PENDING)
   * Backend: PATCH /ideas/reopen/:ideaId
   */
  async reopenIdea(ideaId) {
    try {
      const response = await apiClient.patch(
        `${API_CONFIG.ENDPOINTS.IDEAS}/reopen/${ideaId}`,
        {}
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to reopen idea');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to reopen idea:', error);
      throw error;
    }
  }

  /**
   * Delete idea (soft delete)
   * Backend: DELETE /ideas/delete/:ideaId
   * OPTIONAL FIELDS: deletionReasonType, deletionReasonDescription
   */
  async deleteIdea(ideaId, deleteData = {}) {
    try {
      const response = await apiClient.delete(
        `${API_CONFIG.ENDPOINTS.IDEAS}/delete/${ideaId}`,
        deleteData
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete idea');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to delete idea:', error);
      throw error;
    }
  }
}

export const ideasService = new IdeasService();
export default ideasService;
