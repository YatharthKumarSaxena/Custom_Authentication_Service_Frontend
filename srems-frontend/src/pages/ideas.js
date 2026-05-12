import { ideasService } from '../js/services/ideas.service.js';
import { store } from '../js/store/store.js';
import { showToast, showModal, hideModal } from '../js/utils/helpers.js';

export class IdeasPage {
  constructor() {
    this.ideas = [];
    this.currentIdea = null;
    this.filterStatus = '';
    this.init();
  }

  init() {
    this.attachEventListeners();
    this.loadIdeas();
  }

  attachEventListeners() {
    document.getElementById('btnCreateIdea')?.addEventListener('click', () => this.openCreateModal());
    document.getElementById('ideaForm')?.addEventListener('submit', (e) => this.handleSaveIdea(e));
    document.getElementById('filterStatus')?.addEventListener('change', (e) => {
      this.filterStatus = e.target.value;
      this.renderIdeas();
    });

    // Detail modal buttons
    document.getElementById('btnDetailEdit')?.addEventListener('click', () => this.editCurrentIdea());
    document.getElementById('btnDetailDelete')?.addEventListener('click', () => this.openDeleteModal());
    document.getElementById('btnDetailAccept')?.addEventListener('click', () => this.handleAcceptIdea());
    document.getElementById('btnDetailReject')?.addEventListener('click', () => this.openRejectionModal());
    document.getElementById('btnDetailDefer')?.addEventListener('click', () => this.openDeferralModal());
    document.getElementById('btnDetailReopen')?.addEventListener('click', () => this.handleReopenIdea());

    // Rejection form
    document.getElementById('rejectionForm')?.addEventListener('submit', (e) => this.handleRejectIdea(e));

    // Deferral form
    document.getElementById('deferalForm')?.addEventListener('submit', (e) => this.handleDeferIdea(e));

    // Delete form
    document.getElementById('deleteIdeaForm')?.addEventListener('submit', (e) => this.handleDeleteIdea(e));

    // Modal close buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.currentTarget.getAttribute('data-close-modal');
        hideModal(modalId);
      });
    });
  }

  async loadIdeas() {
    try {
      let projectId = store.state.projects.current?._id || 
                     store.state.projects.current?.id || 
                     store.state.projects.current;

      if (!projectId) {
        const savedProject = localStorage.getItem('CURRENT_PROJECT');
        if (savedProject) {
          try {
            const projectData = typeof savedProject === 'string' ? JSON.parse(savedProject) : savedProject;
            projectId = projectData?._id || projectData?.id || projectData;
            store.state.projects.current = projectData;
          } catch (e) {
            console.error('Failed to parse saved project:', e);
          }
        }
      }

      if (!projectId) {
        showToast('Please select a project', 'warning');
        return;
      }

      const response = await ideasService.listIdeas(projectId);
      
      if (!response.success) {
        showToast(response.message || 'Failed to load ideas', 'error');
        return;
      }

      this.ideas = ideasService.normalizeList(response);
      this.updateStats();
      this.renderIdeas();
    } catch (error) {
      console.error('[Ideas] Error loading ideas:', error);
      showToast(error.message || 'Failed to load ideas', 'error');
    }
  }

  updateStats() {
    const total = this.ideas.length;
    const accepted = this.ideas.filter(i => i.status === 'ACCEPTED').length;
    const rejected = this.ideas.filter(i => i.status === 'REJECTED').length;
    const deferred = this.ideas.filter(i => i.status === 'DEFERRED').length;

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statAccepted').textContent = accepted;
    document.getElementById('statRejected').textContent = rejected;
    document.getElementById('statDeferred').textContent = deferred;
  }

  renderIdeas() {
    const container = document.getElementById('ideasContainer');
    
    let filtered = this.ideas;
    if (this.filterStatus) {
      filtered = this.ideas.filter(i => i.status === this.filterStatus);
    }

    if (filtered.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No ideas yet. Create one to get started!</p></div>';
      return;
    }

    container.innerHTML = filtered.map((idea) => {
      const ideaId = idea._id || idea.id;
      const description = idea.description || '';
      return `
      <div class="list-item idea-card" data-idea-id="${ideaId}">
        <div class="card-header">
          <div>
            <h3 class="card-title">${this.escapeHtml(idea.title || 'Untitled Idea')}</h3>
            <p class="card-description">${this.escapeHtml(description.slice(0, 180))}${description.length > 180 ? '...' : ''}</p>
          </div>
          <span class="badge badge-${this.getStatusColor(idea.status)}">${this.formatStatus(idea.status)}</span>
        </div>
        <div class="card-meta">
          <span>By ${this.escapeHtml(idea.createdBy || 'Unknown')}</span>
          <span>${this.formatDate(idea.createdAt)}</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-sm btn-primary" type="button" onclick="window.ideasPage.viewIdea('${ideaId}')">View</button>
        </div>
      </div>
    `;
    }).join('');
  }

  formatStatus(status) {
    const labels = {
      DRAFT: 'Draft',
      ACCEPTED: 'Accepted',
      REJECTED: 'Rejected',
      DEFERRED: 'Deferred',
      REOPENED: 'Reopened'
    };
    return labels[status] || (status ? this.escapeHtml(status) : 'Unknown');
  }

  getStatusColor(status) {
    const colors = {
      DRAFT: 'secondary',
      ACCEPTED: 'success',
      REJECTED: 'danger',
      DEFERRED: 'warning',
      REOPENED: 'info'
    };
    return colors[status] || 'secondary';
  }

  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  openCreateModal() {
    document.getElementById('ideaModalTitle').textContent = 'Add New Idea';
    document.getElementById('ideaForm').reset();
    this.currentIdea = null;
    showModal('ideaModal');
  }

  editCurrentIdea() {
    if (!this.currentIdea) return;
    
    document.getElementById('ideaModalTitle').textContent = 'Edit Idea';
    document.getElementById('idea-title').value = this.currentIdea.title;
    document.getElementById('idea-description').value = this.currentIdea.description;
    
    hideModal('ideaDetailModal');
    showModal('ideaModal');
  }

  async handleSaveIdea(e) {
    e.preventDefault();

    try {
      let projectId = store.state.projects.current?._id || 
                     store.state.projects.current?.id || 
                     store.state.projects.current;

      if (!projectId) {
        showToast('Please select a project', 'warning');
        return;
      }

      const title = document.getElementById('idea-title').value.trim();
      const description = document.getElementById('idea-description').value.trim();

      if (!title || !description) {
        showToast('Please fill in all required fields', 'error');
        return;
      }

      const ideaData = { title, description };

      let response;
      if (this.currentIdea?._id) {
        // Update existing idea
        response = await ideasService.updateIdea(this.currentIdea._id, ideaData);
      } else {
        // Create new idea
        response = await ideasService.createIdea(projectId, ideaData);
      }

      if (!response.success) {
        const errors = response.validationErrors;
        if (errors && Object.keys(errors).length > 0) {
          const errorMsg = Object.values(errors)[0];
          showToast(errorMsg, 'error');
        } else {
          showToast(response.message || 'Failed to save idea', 'error');
        }
        return;
      }

      hideModal('ideaModal');
      showToast(this.currentIdea?._id ? 'Idea updated successfully' : 'Idea created successfully', 'success');
      await this.loadIdeas();
    } catch (error) {
      console.error('[Ideas] Error saving idea:', error);
      showToast(error.message || 'Failed to save idea', 'error');
    }
  }

  async viewIdea(ideaId) {
    try {
      let idea = this.ideas.find((item) => (item._id || item.id) === ideaId);

      if (!idea) {
        await this.loadIdeas();
        idea = this.ideas.find((item) => (item._id || item.id) === ideaId);
      }

      if (!idea) {
        showToast('Idea not found in the current list', 'error');
        return;
      }

      this.currentIdea = ideasService.normalizeIdea(idea);
      this.renderDetailModal();
      showModal('ideaDetailModal');
    } catch (error) {
      console.error('[Ideas] Error viewing idea:', error);
      showToast(error.message || 'Failed to load idea', 'error');
    }
  }

  renderDetailModal() {
    const idea = this.currentIdea;

    document.getElementById('detailTitle').textContent = this.escapeHtml(idea.title);
    document.getElementById('detailTitle2').textContent = this.escapeHtml(idea.title);
    document.getElementById('detailDescription').textContent = this.escapeHtml(idea.description);
    
    const statusBadge = document.getElementById('detailStatus');
    statusBadge.textContent = idea.status;
    statusBadge.className = `badge badge-${this.getStatusColor(idea.status)}`;

    document.getElementById('detailCreatedBy').textContent = this.escapeHtml(idea.createdBy || 'Unknown');
    document.getElementById('detailCreatedAt').textContent = `Created on ${this.formatDate(idea.createdAt)}`;

    // Show rejection details if rejected
    const rejectionSection = document.getElementById('rejectionSection');
    if (idea.status === 'REJECTED' && idea.rejectionReason) {
      rejectionSection.classList.remove('hidden');
      document.getElementById('detailRejectionReason').textContent = idea.rejectionReason;
      document.getElementById('detailRejectionDescription').textContent = idea.rejectionReasonDescription || '';
    } else {
      rejectionSection.classList.add('hidden');
    }

    // Show deferral details if deferred
    const deferralSection = document.getElementById('deferralSection');
    if (idea.status === 'DEFERRED' && idea.deferralReason) {
      deferralSection.classList.remove('hidden');
      document.getElementById('detailDeferralReason').textContent = idea.deferralReason;
      document.getElementById('detailDeferralDescription').textContent = idea.deferralReasonDescription || '';
    } else {
      deferralSection.classList.add('hidden');
    }

    // Update action buttons visibility
    const canEdit = idea.status === 'DRAFT';
    const canDelete = idea.status === 'DRAFT' || idea.status === 'REJECTED' || idea.status === 'DEFERRED';
    const canAccept = idea.status === 'DRAFT' || idea.status === 'REOPENED';
    const canReject = idea.status === 'DRAFT' || idea.status === 'REOPENED';
    const canDefer = idea.status === 'DRAFT' || idea.status === 'REOPENED';
    const canReopen = idea.status === 'REJECTED' || idea.status === 'DEFERRED';

    document.getElementById('btnDetailEdit').classList.toggle('hidden', !canEdit);
    document.getElementById('btnDetailDelete').classList.toggle('hidden', !canDelete);
    document.getElementById('btnDetailAccept').classList.toggle('hidden', !canAccept);
    document.getElementById('btnDetailReject').classList.toggle('hidden', !canReject);
    document.getElementById('btnDetailDefer').classList.toggle('hidden', !canDefer);
    document.getElementById('btnDetailReopen').classList.toggle('hidden', !canReopen);
  }

  openDeleteModal() {
    document.getElementById('ideaDeletionReasonType').value = '';
    document.getElementById('ideaDeletionReasonDescription').value = '';
    showModal('deleteIdeaModal');
  }

  async handleDeleteIdea(e) {
    e.preventDefault();

    try {
      const ideaId = this.currentIdea?._id || this.currentIdea?.id;
      if (!ideaId) {
        showToast('No idea selected', 'error');
        return;
      }

      const reasonType = document.getElementById('ideaDeletionReasonType')?.value?.trim() || '';
      const reasonDescription = document.getElementById('ideaDeletionReasonDescription')?.value?.trim() || '';

      if (!reasonType) {
        showToast('Please select a deletion reason', 'error');
        return;
      }

      const deleteData = {
        deletionReasonType: reasonType
      };
      if (reasonDescription) deleteData.deletionReasonDescription = reasonDescription;

      const response = await ideasService.deleteIdea(ideaId, deleteData);

      if (!response.success) {
        showToast(response.message || 'Failed to delete idea', 'error');
        return;
      }

      hideModal('deleteIdeaModal');
      hideModal('ideaDetailModal');
      showToast('Idea deleted successfully', 'success');
      await this.loadIdeas();
    } catch (error) {
      console.error('[Ideas] Error deleting idea:', error);
      showToast(error.message || 'Failed to delete idea', 'error');
    }
  }

  async handleAcceptIdea() {
    try {
      const ideaId = this.currentIdea?._id || this.currentIdea?.id;
      if (!ideaId) {
        showToast('No idea selected', 'error');
        return;
      }

      const response = await ideasService.acceptIdea(ideaId);

      if (!response.success) {
        showToast(response.message || 'Failed to accept idea', 'error');
        return;
      }

      showToast('Idea accepted successfully', 'success');
      hideModal('ideaDetailModal');
      await this.loadIdeas();
    } catch (error) {
      console.error('[Ideas] Error accepting idea:', error);
      showToast(error.message || 'Failed to accept idea', 'error');
    }
  }

  openRejectionModal() {
    document.getElementById('rejectionForm').reset();
    showModal('rejectionModal');
  }

  async handleRejectIdea(e) {
    e.preventDefault();

    try {
      const ideaId = this.currentIdea?._id || this.currentIdea?.id;
      if (!ideaId) {
        showToast('No idea selected', 'error');
        return;
      }

      const reason = document.getElementById('rejectionReason')?.value?.trim() || '';
      const description = document.getElementById('rejectionDescription')?.value?.trim() || '';

      if (!reason) {
        showToast('Please select a rejection reason', 'error');
        return;
      }

      const rejectData = {
        rejectionReasonType: reason
      };
      if (description) rejectData.rejectionReasonDescription = description;

      const response = await ideasService.rejectIdea(ideaId, rejectData);

      if (!response.success) {
        showToast(response.message || 'Failed to reject idea', 'error');
        return;
      }

      hideModal('rejectionModal');
      hideModal('ideaDetailModal');
      showToast('Idea rejected successfully', 'success');
      await this.loadIdeas();
    } catch (error) {
      console.error('[Ideas] Error rejecting idea:', error);
      showToast(error.message || 'Failed to reject idea', 'error');
    }
  }

  openDeferralModal() {
    document.getElementById('deferalForm').reset();
    showModal('deferalModal');
  }

  async handleDeferIdea(e) {
    e.preventDefault();

    try {
      const ideaId = this.currentIdea?._id || this.currentIdea?.id;
      if (!ideaId) {
        showToast('No idea selected', 'error');
        return;
      }

      const reason = document.getElementById('deferalReason')?.value?.trim() || '';
      const description = document.getElementById('deferalDescription')?.value?.trim() || '';

      if (!reason) {
        showToast('Please select a deferral reason', 'error');
        return;
      }

      const deferData = {
        deferralReasonType: reason
      };
      if (description) deferData.deferralReasonDescription = description;

      const response = await ideasService.deferIdea(ideaId, deferData);

      if (!response.success) {
        showToast(response.message || 'Failed to defer idea', 'error');
        return;
      }

      hideModal('deferalModal');
      hideModal('ideaDetailModal');
      showToast('Idea deferred successfully', 'success');
      await this.loadIdeas();
    } catch (error) {
      console.error('[Ideas] Error deferring idea:', error);
      showToast(error.message || 'Failed to defer idea', 'error');
    }
  }

  async handleReopenIdea() {
    try {
      const ideaId = this.currentIdea?._id || this.currentIdea?.id;
      if (!ideaId) {
        showToast('No idea selected', 'error');
        return;
      }

      const response = await ideasService.reopenIdea(ideaId);

      if (!response.success) {
        showToast(response.message || 'Failed to reopen idea', 'error');
        return;
      }

      showToast('Idea reopened successfully', 'success');
      hideModal('ideaDetailModal');
      await this.loadIdeas();
    } catch (error) {
      console.error('[Ideas] Error reopening idea:', error);
      showToast(error.message || 'Failed to reopen idea', 'error');
    }
  }
}

// Global access for onclick handlers
window.ideasPage = new IdeasPage();
