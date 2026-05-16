import { showToast, debounce, showModal, hideModal } from '../js/utils/helpers.js';
import productRequestService from '../js/services/product-request.service.js';

export class ProductRequestPage {
  constructor() {
    this.requests = [];
    this.filteredRequests = [];
    this.currentRequest = null;
    this.currentAction = null;
    this.init();
  }

  init() {
    this.attachEventListeners();
    this.loadProductRequests();
  }

  attachEventListeners() {
    document.getElementById('btnCreateProductRequest')?.addEventListener('click', () => this.openCreateModal());
    document.getElementById('btnCreateProductRequestEmpty')?.addEventListener('click', () => this.openCreateModal());
    document.getElementById('productRequestForm')?.addEventListener('submit', (e) => this.handleCreateSubmit(e));
    document.getElementById('closeProductRequestModal')?.addEventListener('click', () => this.closeCreateModal());
    document.getElementById('cancelProductRequestBtn')?.addEventListener('click', () => this.closeCreateModal());
    
    document.getElementById('filterPriority')?.addEventListener('change', () => this.applyFilters());
    document.getElementById('filterRequestStatus')?.addEventListener('change', () => this.applyFilters());
    document.getElementById('searchProductRequest')?.addEventListener('input', debounce(() => this.applyFilters(), 300));
    
    // Action modal handlers
    document.getElementById('actionForm')?.addEventListener('submit', (e) => this.handleActionSubmit(e));
    document.getElementById('actionModal')?.querySelector('[data-close-modal]')?.addEventListener('click', () => hideModal('actionModal'));
  }

  async loadProductRequests() {
    try {
      const container = document.getElementById('productRequestContainer');
      container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading product requests...</p></div>';

      const data = await productRequestService.getProductRequests();
      this.requests = Array.isArray(data) ? data : [];
      this.filteredRequests = this.requests;
      this.renderProductRequests();
    } catch (error) {
      console.error('Failed to load product requests:', error);
      showToast(error.message || 'Failed to load product requests', 'error');
      this.requests = [];
      this.filteredRequests = [];
      this.showEmptyState();
    }
  }

  applyFilters() {
    const priority = document.getElementById('filterPriority').value;
    const status = document.getElementById('filterRequestStatus').value;
    const search = document.getElementById('searchProductRequest').value.toLowerCase();

    if (!Array.isArray(this.requests)) {
      this.requests = [];
    }

    this.filteredRequests = this.requests.filter(item => {
      const priorityMatch = !priority || item.priority === priority;
      const statusMatch = !status || item.status === status;
      const searchMatch = !search || 
        item.title?.toLowerCase().includes(search) ||
        item.requestor?.toLowerCase().includes(search);
      return priorityMatch && statusMatch && searchMatch;
    });

    this.renderProductRequests();
  }

  renderProductRequests() {
    const container = document.getElementById('productRequestContainer');
    const emptyState = document.getElementById('emptyProductRequest');

    if (this.filteredRequests.length === 0) {
      this.showEmptyState();
      return;
    }

    emptyState.classList.add('hidden');
    container.innerHTML = '<div class="list-items">' + this.filteredRequests.map(item => `
      <div class="list-item" data-request-id="${item._id || item.id}">
        <div class="list-item-header">
          <h4>${item.title || 'Untitled Request'}</h4>
          <span class="priority-badge priority-${(item.priority || 'medium').toLowerCase()}">${item.priority || 'Medium'}</span>
        </div>
        <div class="list-item-body">
          <p><strong>Requestor:</strong> ${item.requestor || 'N/A'}</p>
          <p><strong>Description:</strong> ${item.description || 'No description'}</p>
          <p><strong>Submitted:</strong> ${item.submittedDate ? new Date(item.submittedDate).toLocaleDateString() : 'N/A'}</p>
        </div>
        <div class="list-item-status">
          <span class="status-badge status-${(item.status || 'pending').toLowerCase()}">${item.status || 'Pending'}</span>
        </div>
        <div class="list-item-actions">
          ${item.status === 'PENDING' || item.status === 'pending' ? `
            <button class="btn btn-sm btn-success approve-request" data-request-id="${item._id || item.id}">✓ Approve</button>
            <button class="btn btn-sm btn-danger reject-request" data-request-id="${item._id || item.id}">✗ Reject</button>
          ` : ''}
          ${item.status === 'APPROVED' || item.status === 'approved' ? `
            <button class="btn btn-sm btn-warning cancel-request" data-request-id="${item._id || item.id}">⊘ Cancel</button>
          ` : ''}
          <button class="btn btn-sm btn-primary view-request" data-request-id="${item._id || item.id}">View</button>
        </div>
      </div>
    `).join('') + '</div>';
    
    this.attachRequestListeners();
  }

  attachRequestListeners() {
    document.querySelectorAll('.approve-request').forEach(btn => {
      btn.addEventListener('click', (e) => this.openActionModal(e.target.dataset.requestId, 'approve'));
    });
    
    document.querySelectorAll('.reject-request').forEach(btn => {
      btn.addEventListener('click', (e) => this.openActionModal(e.target.dataset.requestId, 'reject'));
    });
    
    document.querySelectorAll('.cancel-request').forEach(btn => {
      btn.addEventListener('click', (e) => this.cancelRequest(e.target.dataset.requestId));
    });
    
    document.querySelectorAll('.view-request').forEach(btn => {
      btn.addEventListener('click', (e) => this.viewRequest(e.target.dataset.requestId));
    });
  }

  openActionModal(requestId, action) {
    const request = this.requests.find(r => r._id === requestId || r.id === requestId);
    if (!request) return;
    
    this.currentRequest = request;
    this.currentAction = action;
    
    const modal = document.getElementById('actionModal');
    const title = document.getElementById('actionModalTitle');
    const reasonTypeLabel = document.getElementById('reasonTypeLabel');
    const reasonDescLabel = document.getElementById('reasonDescriptionLabel');
    const reasonDescField = document.getElementById('reasonDescription');
    const reasonTypeField = document.getElementById('reasonType');
    const reasonDescriptionGroup = document.getElementById('reasonDescriptionGroup');

    const approvalTypes = [
      'ALIGNED_WITH_STRATEGY',
      'HIGH_VALUE',
      'URGENT_NEEDS',
      'RESOURCE_AVAILABILITY',
      'OTHER'
    ];

    const rejectionTypes = [
      'INSUFFICIENT_INFORMATION',
      'NOT_ALIGNED_WITH_STRATEGY',
      'BUDGET_CONSTRAINTS',
      'RESOURCE_LIMITATIONS',
      'DUPLICATE_REQUEST',
      'OTHER'
    ];
    
    if (action === 'approve') {
      title.textContent = 'Approve Request';
      reasonTypeLabel.textContent = 'Approval Type (Optional)';
      reasonTypeField.innerHTML = '<option value="">Select Type</option>' + approvalTypes
        .map(type => `<option value="${type}">${type.replaceAll('_', ' ')}</option>`)
        .join('');
      reasonDescriptionGroup.classList.add('hidden');
    } else if (action === 'reject') {
      title.textContent = 'Reject Request';
      reasonTypeLabel.textContent = 'Rejection Reason Type *';
      reasonTypeField.innerHTML = rejectionTypes
        .map(type => `<option value="${type}">${type.replaceAll('_', ' ')}</option>`)
        .join('');
      reasonDescriptionGroup.classList.remove('hidden');
      reasonDescLabel.textContent = 'Rejection Details *';
    }
    
    document.getElementById('actionForm').reset();
    showModal('actionModal');
  }

  async handleActionSubmit(event) {
    event.preventDefault();
    
    if (!this.currentRequest || !this.currentAction) return;
    
    const selectedReasonType = document.getElementById('reasonType').value;
    const reasonType = this.currentAction === 'approve'
      ? (selectedReasonType || 'ALIGNED_WITH_STRATEGY')
      : selectedReasonType;
    const reasonDescription = document.getElementById('reasonDescription').value;
    
    // Validate reject action requires description
    if (this.currentAction === 'reject' && (!reasonType || !reasonDescription)) {
      showToast('Rejection details are required', 'error');
      return;
    }
    
    try {
      const requestId = this.currentRequest._id || this.currentRequest.id;
      
      if (this.currentAction === 'approve') {
        await productRequestService.approveProductRequest(requestId, reasonType, reasonDescription);
        showToast('Request approved successfully', 'success');
      } else if (this.currentAction === 'reject') {
        await productRequestService.rejectProductRequest(requestId, reasonType, reasonDescription);
        showToast('Request rejected successfully', 'success');
      }
      
      hideModal('actionModal');
      await this.loadProductRequests();
    } catch (error) {
      showToast(error.message || 'Failed to process request action', 'error');
    }
  }

  async cancelRequest(requestId) {
    if (!confirm('Are you sure you want to cancel this request?')) return;
    
    try {
      await productRequestService.cancelProductRequest(requestId);
      showToast('Request cancelled successfully', 'success');
      await this.loadProductRequests();
    } catch (error) {
      showToast(error.message || 'Failed to cancel request', 'error');
    }
  }

  viewRequest(requestId) {
    const request = this.requests.find(r => r._id === requestId || r.id === requestId);
    if (!request) return;
    
    // Show detailed view (can be expanded to show full details)
    console.log('Viewing request:', request);
    showToast(`Viewing: ${request.title}`, 'info');
  }

  showEmptyState() {
    document.getElementById('emptyProductRequest')?.classList.remove('hidden');
    document.getElementById('productRequestContainer').innerHTML = '';
  }

  openCreateModal() {
    document.getElementById('productRequestForm')?.reset();
    showModal('productRequestModal');
  }

  closeCreateModal() {
    hideModal('productRequestModal');
    document.getElementById('productRequestForm')?.reset();
  }

  async handleCreateSubmit(event) {
    event.preventDefault();

    const title = document.getElementById('productRequestTitle')?.value?.trim();
    const description = document.getElementById('productRequestDescription')?.value?.trim();
    const projectType = document.getElementById('productRequestProjectType')?.value;
    const projectCategory = document.getElementById('productRequestProjectCategory')?.value;
    const priority = document.getElementById('productRequestPriority')?.value;
    const expectedTimelineInDays = document.getElementById('productRequestTimeline')?.value;
    const budget = document.getElementById('productRequestBudget')?.value;

    if (!title || !description || !projectType || !projectCategory || !priority) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      await productRequestService.createProductRequest({
        title,
        description,
        projectType,
        projectCategory,
        priority,
        ...(expectedTimelineInDays ? { expectedTimelineInDays: Number(expectedTimelineInDays) } : {}),
        ...(budget ? { budget: Number(budget) } : {})
      });

      showToast('Product request created successfully', 'success');
      this.closeCreateModal();
      await this.loadProductRequests();
    } catch (error) {
      showToast(error.message || 'Failed to create product request', 'error');
    }
  }
}
