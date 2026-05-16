/**
 * negotiation.service.js
 * Negotiation phase management operations
 */

import apiClient from './api.js';

class NegotiationService {
  /**
   * Create negotiation phase
   * Backend: POST /negotiations/create/:projectId
   */
  async createNegotiation(projectId, negotiationData = {}) {
    return apiClient.post(
      `/negotiations/create/${projectId}`,
      negotiationData
    );
  }

  /**
   * Get all negotiations
   * Backend: GET /negotiations/list/:projectId
   */
  async getNegotiations(projectId) {
    try {
      const response = await apiClient.get(
        `/negotiations/list/${projectId}`
      );
      
      if (!response.success) {
        return [];
      }
      
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Failed to fetch negotiations:', error);
      return [];
    }
  }

  /**
   * Get latest (active) negotiation for a project
   * Backend: GET /negotiations/latest/:projectId
   */
  async getLatestNegotiation(projectId) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      const response = await apiClient.get(`/negotiations/latest/${projectId}`);
      return response.data?.data?.negotiation || response.data?.data || null;
    } catch (error) {
      console.error('Failed to fetch latest negotiation:', error);
      return null;
    }
  }

  /**
   * Freeze negotiation
   * Backend: PATCH /negotiations/freeze/:projectId
   */
  async freezeNegotiation(projectId) {
    return apiClient.patch(
      `/negotiations/freeze/${projectId}`,
      {}
    );
  }

  /**
   * Get single negotiation
   * Backend: GET /negotiations/get/:negotiationId
   */
  async getNegotiation(projectId, negotiationId) {
    return apiClient.get(
      `/negotiations/get/${negotiationId}`
    );
  }

  /**
   * Update negotiation
   * Backend: PATCH /negotiations/update/:projectId
   */
  async updateNegotiation(projectId, negotiationId, updateData) {
    return apiClient.patch(
      `/negotiations/update/${projectId}`,
      { negotiationId, ...updateData }
    );
  }

  /**
   * Delete negotiation phase
   * Backend: DELETE /negotiations/delete/:projectId
   */
  async deleteNegotiation(projectId, negotiationId, deleteData = {}) {
    return apiClient.delete(
      `/negotiations/delete/${projectId}`,
      { negotiationId, ...deleteData }
    );
  }
}

export const negotiationService = new NegotiationService();
export default negotiationService;
