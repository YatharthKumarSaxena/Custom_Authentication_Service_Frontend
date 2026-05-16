/**
 * elaboration.service.js
 * Elaboration management operations
 */

import apiClient from './api.js';
import { API_CONFIG } from '../utils/constants.js';

class ElaborationService {
  /**
   * Create elaboration
   * Backend: POST /elaborations/create/:projectId
   */
  async createElaboration(elaborationData) {
    const { projectId, ...data } = elaborationData;
    return apiClient.post(
      `/elaborations/create/${projectId}`,
      data
    );
  }

  /**
   * Get all elaborations
   * Backend: GET /elaborations/list/:projectId
   */
  async getElaborations(projectId) {
    try {
      const response = await apiClient.get(
        `/elaborations/list/${projectId}`
      );
      
      if (!response.success) {
        return [];
      }
      
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Failed to fetch elaborations:', error);
      return [];
    }
  }

  /**
   * Get single elaboration
   * Backend: GET /elaborations/get/:elaborationId
   */
  async getElaboration(projectId, elaborationId) {
    return apiClient.get(
      `/elaborations/get/${elaborationId}`
    );
  }

  /**
   * Update elaboration
   * Backend: PATCH /elaborations/update/:projectId
   */
  async updateElaboration(projectId, elaborationId, updateData) {
    return apiClient.patch(
      `/elaborations/update/${projectId}`,
      { elaborationId, ...updateData }
    );
  }

  /**
   * Delete elaboration
   * Backend: DELETE /elaborations/delete/:projectId
   */
  async deleteElaboration(projectId, elaborationId, deleteData = {}) {
    return apiClient.delete(
      `/elaborations/delete/${projectId}`,
      { elaborationId, ...deleteData }
    );
  }

  /**
   * Get elaborations by project
   */
  async getElaborationsByProject(projectId) {
    return apiClient.get(
      `/elaborations/list/${projectId}`
    );
  }

  /**
   * Get latest (active) elaboration for a project
   * Backend: GET /elaborations/latest/:projectId
   */
  async getLatestElaboration(projectId) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      const response = await apiClient.get(`/elaborations/latest/${projectId}`);
      return response.data?.data?.elaboration || response.data?.data || null;
    } catch (error) {
      console.error('Failed to fetch latest elaboration:', error);
      return null;
    }
  }

  /**
   * Freeze elaboration
   * Backend: PATCH /elaborations/freeze/:projectId
   */
  async freezeElaboration(projectId) {
    return apiClient.patch(
      `/elaborations/freeze/${projectId}`,
      {}
    );
  }

}

export const elaborationService = new ElaborationService();
export default elaborationService;
