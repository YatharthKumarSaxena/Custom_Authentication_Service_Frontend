import { requirementsService } from '../js/services/requirements.service.js';
import { scopeService } from '../js/services/scope.service.js';
import { projectsService } from '../js/services/projects.service.js';
import { specificationService } from '../js/services/specification.service.js';
import { store } from '../js/store/store.js';
import { showToast, showConfirmDialog, formatDate } from '../js/utils/helpers.js';

export class SpecificationPage {
  constructor() {
    this.project = null;
    this.requirements = [];
    this.scopeItems = [];
    this.init();
  }

  init() {
    this.attachEventListeners();
    this.loadSpecification();
  }

  attachEventListeners() {
    document.getElementById('btnCreateSpecification')?.addEventListener('click', () => this.handleCreateSpecification());
    document.getElementById('btnFreezeSpecification')?.addEventListener('click', () => this.handleFreezeSpecification());
    document.getElementById('btnDeleteSpecification')?.addEventListener('click', () => this.openDeleteModal());
    document.getElementById('btnExportSRS')?.addEventListener('click', () => this.exportPDF());
    document.getElementById('btnPrintSRS')?.addEventListener('click', () => window.print());
    document.getElementById('deleteSpecificationForm')?.addEventListener('submit', (e) => this.handleDeleteSpecification(e));
    
    // Modal close buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.currentTarget.getAttribute('data-close-modal');
        hideModal(modalId);
      });
    });
  }

  async loadSpecification() {
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

      // Check for active specification phase
      const specification = await specificationService.getLatestSpecification(projectId);
      
      const btnCreate = document.getElementById('btnCreateSpecification');
      const btnFreeze = document.getElementById('btnFreezeSpecification');
      const btnExport = document.getElementById('btnExportSRS');
      const btnPrint = document.getElementById('btnPrintSRS');
      const viewer = document.getElementById('srsViewer');

      if (specification) {
        // Hide create, show freeze and print
        if (btnCreate) btnCreate.classList.add('hidden');
        if (btnExport) btnExport.classList.remove('hidden');
        if (btnPrint) btnPrint.classList.remove('hidden');
        if (viewer) viewer.style.display = 'block';
        
        if (btnFreeze) {
          if (!specification.isFrozen && !specification.isDeleted) {
            btnFreeze.classList.remove('hidden');
          } else {
            btnFreeze.classList.add('hidden');
          }
        }

        const btnDelete = document.getElementById('btnDeleteSpecification');
        if (btnDelete) {
          if (!specification.isFrozen && !specification.isDeleted) {
            btnDelete.classList.remove('hidden');
          } else {
            btnDelete.classList.add('hidden');
          }
        }

        // Load all data
        this.project = await projectsService.getProjectById(projectId);
        this.requirements = await requirementsService.getRequirements(projectId);
        this.scopeItems = await scopeService.getScopesByProject(projectId);

        this.renderSRS();
      } else {
        // Show create, hide others
        if (btnCreate) btnCreate.classList.remove('hidden');
        if (btnFreeze) btnFreeze.classList.add('hidden');
        if (btnExport) btnExport.classList.add('hidden');
        if (btnPrint) btnPrint.classList.add('hidden');
        
        if (viewer) {
          viewer.innerHTML = '<div class="empty-state" style="margin-top: 40px; text-align: center;"><p>No Specification phase created yet. Create one to generate the SRS Document.</p></div>';
        }
      }

    } catch (error) {
      showToast(error.message || 'Failed to load specification', 'error');
    }
  }

  async handleCreateSpecification() {
    try {
      let projectId = store.state.projects.current?._id || 
                     store.state.projects.current?.id || 
                     store.state.projects.current;

      const response = await specificationService.createSpecification(projectId, {});
      if (!response.success) {
        showToast(response.message || 'Failed to create specification phase', 'error');
        return;
      }

      showToast('Specification phase created successfully!', 'success');
      // Must restore viewer HTML structure before reloading
      const viewer = document.getElementById('srsViewer');
      if (viewer && viewer.innerHTML.includes('empty-state')) {
         window.location.reload(); // Quickest way to restore the full DOM structure for rendering
         return;
      }
      await this.loadSpecification();
    } catch (error) {
      console.error('[Specification] Error creating phase:', error);
      showToast(error.message || 'Failed to create specification phase', 'error');
    }
  }

  async handleFreezeSpecification() {
    const confirmed = await showConfirmDialog('Freeze Specification Phase', 'Are you sure you want to freeze this phase? This action cannot be undone and will lock the SRS document.');
    if (!confirmed) return;

    try {
      let projectId = store.state.projects.current?._id || 
                     store.state.projects.current?.id || 
                     store.state.projects.current;

      const response = await specificationService.freezeSpecification(projectId);
      if (!response.success) {
        showToast(response.message || 'Failed to freeze specification phase', 'error');
        return;
      }

      showToast('Specification phase frozen successfully. You can now proceed to Validation.', 'success');
      await this.loadSpecification(); // Reload the data to update UI state
    } catch (error) {
      console.error('[Specification] Error freezing phase:', error);
      showToast(error.message || 'Failed to freeze specification phase', 'error');
    }
  }

  renderSRS() {
    // Title page
    const now = new Date();
    document.getElementById('srsProjectName').textContent = this.project?.name || '—';
    document.getElementById('srsVersion').textContent = this.project?.version || '1.0';
    document.getElementById('srsDate').textContent = formatDate(now);
    document.getElementById('srsStatus').textContent = this.project?.currentPhase || 'Draft';
    document.getElementById('srsCreated').textContent = formatDate(this.project?.createdAt) || '—';
    document.getElementById('srsUpdated').textContent = formatDate(this.project?.updatedAt) || '—';
    document.getElementById('srsStakeholders').textContent = this.project?.stakeholderCount || '0';

    // Functional requirements
    const functionalReqs = this.requirements.filter(r => r.type === 'functional');
    document.getElementById('functionalReqs').innerHTML = functionalReqs.length === 0
      ? '<p>No functional requirements defined</p>'
      : functionalReqs.map(r => this.createRequirementClause(r)).join('');

    // Non-functional requirements
    const nonFunctionalReqs = this.requirements.filter(r => r.type === 'non-functional');
    document.getElementById('nonFunctionalReqs').innerHTML = nonFunctionalReqs.length === 0
      ? '<p>No non-functional requirements defined</p>'
      : nonFunctionalReqs.map(r => this.createRequirementClause(r)).join('');

    // Scope
    const inScope = this.scopeItems.filter(s => s.type === 'included');
    const outOfScope = this.scopeItems.filter(s => s.type === 'excluded');

    document.getElementById('inScopeItems').innerHTML = inScope.length === 0
      ? '<li>—</li>'
      : inScope.map(s => `<li>${s.description}</li>`).join('');

    document.getElementById('outOfScopeItems').innerHTML = outOfScope.length === 0
      ? '<li>—</li>'
      : outOfScope.map(s => `<li>${s.description}</li>`).join('');

    // Acceptance criteria
    const withCriteria = this.requirements.filter(r => r.elaborationDetails?.acceptanceCriteria);
    document.getElementById('acceptanceCriteria').innerHTML = withCriteria.length === 0
      ? '<p>No acceptance criteria defined</p>'
      : withCriteria.map(r => `
          <div class="acceptance-item">
            <h4>${r.description}</h4>
            <pre>${r.elaborationDetails.acceptanceCriteria}</pre>
          </div>
        `).join('');
  }

  createRequirementClause(req) {
    return `
      <div class="requirement-clause">
        <h3>${req.description}</h3>
        <table class="requirement-details">
          <tr>
            <td><strong>Requirement ID:</strong></td>
            <td>${req._id.substring(0, 8)}</td>
          </tr>
          <tr>
            <td><strong>Priority:</strong></td>
            <td>${req.priority}</td>
          </tr>
          <tr>
            <td><strong>Category:</strong></td>
            <td>${req.category || '—'}</td>
          </tr>
          ${req.elaborationDetails?.acceptanceCriteria ? `
          <tr>
            <td><strong>Acceptance Criteria:</strong></td>
            <td><pre>${req.elaborationDetails.acceptanceCriteria}</pre></td>
          </tr>
          ` : ''}
          ${req.elaborationDetails?.dependencies ? `
          <tr>
            <td><strong>Dependencies:</strong></td>
            <td>${req.elaborationDetails.dependencies}</td>
          </tr>
          ` : ''}
          ${req.elaborationDetails?.effort ? `
          <tr>
            <td><strong>Estimated Effort:</strong></td>
            <td>${req.elaborationDetails.effort} hours</td>
          </tr>
          ` : ''}
        </table>
      </div>
    `;
  }

  openDeleteModal() {
    showModal('deleteSpecificationModal');
  }

  async handleDeleteSpecification(e) {
    e.preventDefault();

    try {
      let projectId = store.state.projects.current?._id || 
                     store.state.projects.current?.id || 
                     store.state.projects.current;

      if (!projectId) {
        showToast('Please select a project', 'warning');
        return;
      }

      const reasonType = document.getElementById('specDeletionReasonType')?.value?.trim() || '';
      const reasonDescription = document.getElementById('specDeletionReasonDescription')?.value?.trim() || '';

      if (!reasonType) {
        showToast('Please select a valid deletion reason', 'error');
        return;
      }

      const deleteData = { deletionReasonType: reasonType };
      if (reasonDescription) deleteData.deletionReasonDescription = reasonDescription;

      const response = await specificationService.deleteSpecification(projectId, deleteData);

      if (!response.success) {
        showToast(response.message || 'Failed to delete specification phase', 'error');
        return;
      }

      hideModal('deleteSpecificationModal');
      showToast('Specification phase deleted successfully', 'success');
      setTimeout(() => { window.location.reload(); }, 800);
    } catch (error) {
      console.error('[Specification] Error deleting phase:', error);
      showToast(error.message || 'Failed to delete specification phase', 'error');
    }
  }

  exportPDF() {
    // In a real app, integrate with a PDF library like jsPDF or html2pdf
    showToast('PDF export functionality would be integrated here', 'info');
    // window.print(); could be used as fallback
  }
}


