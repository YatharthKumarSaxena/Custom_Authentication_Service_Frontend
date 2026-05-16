import { requirementsService } from '../js/services/requirements.service.js';
import { elaborationService } from '../js/services/elaboration.service.js';
import { store } from '../js/store/store.js';
import { showToast, showConfirmDialog, showModal, hideModal } from '../js/utils/helpers.js';

export class ElaborationPage {
  constructor() {
    this.requirements = [];
    this.currentReqIndex = 0;
    this.elaborationData = {};
    this.init();
  }

  init() {
    this.attachEventListeners();
    this.loadRequirements();
  }

  attachEventListeners() {
    document.getElementById('btnStartElaboration')?.addEventListener('click', () => this.startElaboration());
    document.getElementById('btnCreateElaboration')?.addEventListener('click', () => this.handleCreateElaboration());
    document.getElementById('btnFreezeElaboration')?.addEventListener('click', () => this.handleFreezeElaboration());
    document.getElementById('btnDeleteElaboration')?.addEventListener('click', () => this.openDeleteModal());
    document.getElementById('elaborationForm')?.addEventListener('submit', (e) => this.handleFormSubmit(e));
    document.getElementById('deleteElaborationForm')?.addEventListener('submit', (e) => this.handleDeleteElaboration(e));
    
    // Modal close buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.currentTarget.getAttribute('data-close-modal');
        hideModal(modalId);
      });
    });
  }

  async loadRequirements() {
    try {
      // Get current project from store or localStorage
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

      // Check for active elaboration phase
      const elaboration = await elaborationService.getLatestElaboration(projectId);
      
      const btnCreate = document.getElementById('btnCreateElaboration');
      const btnFreeze = document.getElementById('btnFreezeElaboration');
      const btnStart = document.getElementById('btnStartElaboration');
      const container = document.getElementById('elaborationContainer');

      if (elaboration) {
        // Hide create, show freeze and start
        if (btnCreate) btnCreate.classList.add('hidden');
        if (btnStart) btnStart.classList.remove('hidden');
        
        if (btnFreeze) {
          if (!elaboration.isFrozen && !elaboration.isDeleted) {
            btnFreeze.classList.remove('hidden');
          } else {
            btnFreeze.classList.add('hidden');
            if (btnStart) btnStart.classList.add('hidden'); // Cannot start if frozen
          }
        }

        const btnDelete = document.getElementById('btnDeleteElaboration');
        if (btnDelete) {
          if (!elaboration.isFrozen && !elaboration.isDeleted) {
            btnDelete.classList.remove('hidden');
          } else {
            btnDelete.classList.add('hidden');
          }
        }

        this.requirements = await requirementsService.getRequirements(projectId);
        this.renderRequirementsQueue();
      } else {
        // Show create, hide others
        if (btnCreate) btnCreate.classList.remove('hidden');
        if (btnFreeze) btnFreeze.classList.add('hidden');
        if (btnStart) btnStart.classList.add('hidden');
        
        const btnDelete = document.getElementById('btnDeleteElaboration');
        if (btnDelete) btnDelete.classList.add('hidden');
        
        if (container) {
          container.innerHTML = '<div class="empty-state"><p>No Elaboration phase created yet. Create one to begin.</p></div>';
        }
      }
    } catch (error) {
      showToast(error.message || 'Failed to load requirements', 'error');
    }
  }

  async handleCreateElaboration() {
    try {
      let projectId = store.state.projects.current?._id || 
                     store.state.projects.current?.id || 
                     store.state.projects.current;

      const response = await elaborationService.createElaboration(projectId, {});
      if (!response.success) {
        showToast(response.message || 'Failed to create elaboration phase', 'error');
        return;
      }

      showToast('Elaboration phase created successfully!', 'success');
      await this.loadRequirements();
    } catch (error) {
      console.error('[Elaboration] Error creating phase:', error);
      showToast(error.message || 'Failed to create elaboration phase', 'error');
    }
  }

  async handleFreezeElaboration() {
    const confirmed = await showConfirmDialog('Freeze Elaboration Phase', 'Are you sure you want to freeze this phase? This action cannot be undone and will lock the phase from further edits.');
    if (!confirmed) return;

    try {
      let projectId = store.state.projects.current?._id || 
                     store.state.projects.current?.id || 
                     store.state.projects.current;

      const response = await elaborationService.freezeElaboration(projectId);
      if (!response.success) {
        showToast(response.message || 'Failed to freeze elaboration phase', 'error');
        return;
      }

      showToast('Elaboration phase frozen successfully. You can now proceed to Negotiation.', 'success');
      await this.loadRequirements(); // Reload the data to update UI state
    } catch (error) {
      console.error('[Elaboration] Error freezing phase:', error);
      showToast(error.message || 'Failed to freeze elaboration phase', 'error');
    }
  }

  renderRequirementsQueue() {
    const container = document.getElementById('elaborationContainer');
    if (this.requirements.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No requirements to elaborate</p></div>';
      return;
    }

    const elaboratedCount = this.requirements.filter(r => r.elaborated).length;
    document.getElementById('reqToElaborate').textContent = this.requirements.filter(r => !r.elaborated).length;
    document.getElementById('reqCompleted').textContent = elaboratedCount;
    document.getElementById('elaborationProgress').style.width = `${(elaboratedCount / this.requirements.length) * 100}%`;

    container.innerHTML = this.requirements.map((req, idx) => `
      <div class="elaboration-item ${req.elaborated ? 'completed' : ''}" data-index="${idx}">
        <div class="item-header">
          <div class="item-number">${idx + 1}</div>
          <div class="item-content">
            <p class="item-description">${req.description}</p>
            <div class="item-meta">
              <span class="badge">${req.type}</span>
              <span class="badge">${req.priority}</span>
            </div>
          </div>
          <div class="item-status">
            ${req.elaborated ? '<span class="badge success">✓ Done</span>' : '<button class="btn btn-sm btn-primary elaborate-btn">Elaborate</button>'}
          </div>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.elaborate-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.closest('.elaboration-item').dataset.index);
        this.openElaborationModal(index);
      });
    });
  }

  openElaborationModal(index) {
    this.currentReqIndex = index;
    const req = this.requirements[index];

    document.getElementById('elaborationTitle').textContent = `Elaborate: ${req.description.substring(0, 50)}...`;
    document.getElementById('reqDisplay').innerHTML = `
      <div class="requirement-preview">
        <p><strong>Description:</strong> ${req.description}</p>
        <p><strong>Type:</strong> ${req.type}</p>
        <p><strong>Priority:</strong> ${req.priority}</p>
      </div>
    `;

    document.getElementById('elab-acceptance-criteria').value = this.elaborationData[req._id]?.acceptanceCriteria || '';
    document.getElementById('elab-dependencies').value = this.elaborationData[req._id]?.dependencies || '';
    document.getElementById('elab-effort').value = this.elaborationData[req._id]?.effort || '';
    document.getElementById('elab-risk-level').value = this.elaborationData[req._id]?.riskLevel || '';
    document.getElementById('elab-notes').value = this.elaborationData[req._id]?.technicalNotes || '';

    showModal('elaborationModal');
  }

  async handleFormSubmit(event) {
    event.preventDefault();

    const req = this.requirements[this.currentReqIndex];
    const formData = {
      acceptanceCriteria: document.getElementById('elab-acceptance-criteria').value,
      dependencies: document.getElementById('elab-dependencies').value,
      effort: parseFloat(document.getElementById('elab-effort').value) || 0,
      riskLevel: document.getElementById('elab-risk-level').value,
      technicalNotes: document.getElementById('elab-notes').value,
    };

    try {
      await requirementsService.updateRequirement(req._id, {
        elaborated: true,
        elaborationDetails: formData,
      });

      this.elaborationData[req._id] = formData;
      showToast('Elaboration saved', 'success');
      
      hideModal('elaborationModal');
      await this.loadRequirements();

      // Move to next
      if (this.currentReqIndex < this.requirements.length - 1) {
        setTimeout(() => this.openElaborationModal(this.currentReqIndex + 1), 500);
      }
    } catch (error) {
      showToast(error.message || 'Failed to save elaboration', 'error');
    }
  }

  startElaboration() {
    const unelaborated = this.requirements.findIndex(r => !r.elaborated);
    if (unelaborated === -1) {
      showToast('All requirements already elaborated!', 'info');
      return;
    }
    this.openElaborationModal(unelaborated);
  }

  openDeleteModal() {
    showModal('deleteElaborationModal');
  }

  async handleDeleteElaboration(e) {
    e.preventDefault();

    try {
      let projectId = store.state.projects.current?._id || 
                     store.state.projects.current?.id || 
                     store.state.projects.current;

      if (!projectId) {
        showToast('Please select a project', 'warning');
        return;
      }

      const reasonType = document.getElementById('elabDeletionReasonType')?.value?.trim() || '';
      const reasonDescription = document.getElementById('elabDeletionReasonDescription')?.value?.trim() || '';

      if (!reasonType) {
        showToast('Please select a valid deletion reason', 'error');
        return;
      }

      const deleteData = { deletionReasonType: reasonType };
      if (reasonDescription) deleteData.deletionReasonDescription = reasonDescription;

      const response = await elaborationService.deleteElaboration(projectId, deleteData);

      if (!response.success) {
        showToast(response.message || 'Failed to delete elaboration phase', 'error');
        return;
      }

      hideModal('deleteElaborationModal');
      showToast('Elaboration phase deleted successfully', 'success');
      setTimeout(() => { window.location.reload(); }, 800);
    } catch (error) {
      console.error('[Elaboration] Error deleting phase:', error);
      showToast(error.message || 'Failed to delete elaboration phase', 'error');
    }
  }
}


