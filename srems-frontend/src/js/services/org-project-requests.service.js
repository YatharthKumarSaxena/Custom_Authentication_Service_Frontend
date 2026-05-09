/**
 * org-project-requests.service.js
 * Organization Project Requests management
 * Handles requests from clients to join organization projects
 * 
 * Backend Endpoints:
 * POST   /org-project-requests/create
 * GET    /org-project-requests
 * GET    /org-project-requests/:requestId
 * GET    /org-project-requests/by-project/:projectId
 * PATCH  /org-project-requests/update/:requestId
 * PATCH  /org-project-requests/withdraw/:requestId
 * PATCH  /org-project-requests/approve/:requestId
 * PATCH  /org-project-requests/reject/:requestId
 */

import apiClient from './api.js';
import { API_CONFIG } from '../utils/constants.js';

class OrgProjectRequestService {
  /**
   * Create new org project request
   * Backend: POST /org-project-requests/create
   * REQUIRED FIELDS: projectId, clientId, joinRole
   * OPTIONAL FIELDS: requestDescription, expectedDuration
   */
  async createOrgProjectRequest(requestData) {
    try {
      const response = await apiClient.post(
        '/org-project-requests/create',
        requestData
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create org project request');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to create org project request:', error);
      throw error;
    }
  }

  /**
   * Get all org project requests for authenticated client
   * Backend: GET /org-project-requests
   */
  async getOrgProjectRequests(page = 1, pageSize = 10) {
    try {
      const response = await apiClient.get(
        `/org-project-requests?page=${page}&pageSize=${pageSize}`
      );
      
      if (!response.success) {
        return [];
      }
      
      return Array.isArray(response.data?.data?.requests) ? response.data.data.requests :
             Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Failed to fetch org project requests:', error);
      return [];
    }
  }

  /**
   * Get single org project request by ID
   * Backend: GET /org-project-requests/:requestId
   */
  async getOrgProjectRequest(requestId) {
    try {
      if (!requestId) {
        throw new Error('Request ID is required');
      }

      const response = await apiClient.get(
        `/org-project-requests/${requestId}`
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch org project request');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to fetch org project request:', error);
      throw error;
    }
  }

  /**
   * Get all org project requests for a specific project
   * Backend: GET /org-project-requests/by-project/:projectId
   */
  async getOrgProjectRequestsByProject(projectId, page = 1, pageSize = 10) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const response = await apiClient.get(
        `/org-project-requests/by-project/${projectId}?page=${page}&pageSize=${pageSize}`
      );
      
      if (!response.success) {
        return [];
      }
      
      return Array.isArray(response.data?.data?.requests) ? response.data.data.requests :
             Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Failed to fetch org project requests by project:', error);
      return [];
    }
  }

  /**
   * Update org project request
   * Backend: PATCH /org-project-requests/update/:requestId
   * OPTIONAL FIELDS: joinRole, requestDescription, expectedDuration
   */
  async updateOrgProjectRequest(requestId, updateData) {
    try {
      const response = await apiClient.patch(
        `/org-project-requests/update/${requestId}`,
        updateData
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update org project request');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to update org project request:', error);
      throw error;
    }
  }

  /**
   * Withdraw org project request
   * Backend: PATCH /org-project-requests/withdraw/:requestId
   * OPTIONAL FIELDS: withdrawReason, withdrawDescription
   */
  async withdrawOrgProjectRequest(requestId, withdrawData = {}) {
    try {
      const response = await apiClient.patch(
        `/org-project-requests/withdraw/${requestId}`,
        withdrawData
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to withdraw org project request');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to withdraw org project request:', error);
      throw error;
    }
  }

  /**
   * Approve org project request (project manager only)
   * Backend: PATCH /org-project-requests/approve/:requestId
   * OPTIONAL FIELDS: approvalNotes, addedAt
   */
  async approveOrgProjectRequest(requestId, approvalData = {}) {
    try {
      const response = await apiClient.patch(
        `/org-project-requests/approve/${requestId}`,
        approvalData
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to approve org project request');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to approve org project request:', error);
      throw error;
    }
  }

  /**
   * Reject org project request (project manager only)
   * Backend: PATCH /org-project-requests/reject/:requestId
   * OPTIONAL FIELDS: rejectionReason, rejectionDescription
   */
  async rejectOrgProjectRequest(requestId, rejectionData = {}) {
    try {
      const response = await apiClient.patch(
        `/org-project-requests/reject/${requestId}`,
        rejectionData
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to reject org project request');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to reject org project request:', error);
      throw error;
    }
  }
}

export const orgProjectRequestService = new OrgProjectRequestService();
export default orgProjectRequestService;
