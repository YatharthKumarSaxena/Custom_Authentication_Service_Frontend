import { participantsService } from '../js/services/participants.service.js';
import { ENTITY_TYPES, PARTICIPANT_TYPES } from '../js/utils/constants.js';

/**
 * Participants Page Controller
 * 
 * IMPORTANT: This page links EXISTING users to meetings
 * It does NOT create new participant profiles
 * Backend expects: userId (USR-prefixed like "USR1100000")
 */
class ParticipantsPage {
  constructor() {
    this.participants = [];
    this.filteredParticipants = [];
    this.editingParticipantId = null;
    this.entityType = 'inceptions';  // Default (PLURAL form for backend API)
    this.meetingId = null;
    this.init();
  }

  async init() {
    try { document.title = 'SREMS | Participants'; } catch (e) {}
    try { console.info('[Page] ParticipantsPage init — app version', window?.SREMS_APP_VERSION || 'unknown'); } catch (e) {}
    setTimeout(() => {
      this.setupEventListeners();
      this.updateMeetingInfoDisplay();  // ✅ Show current meeting info
      this.loadParticipants();  // ✅ Auto-load participants on init
    }, 50);
  }

  // ✅ NEW: Display current meeting info
  updateMeetingInfoDisplay() {
    const meetingDisplay = document.getElementById('currentMeetingDisplay');
    const meetingIdInput = document.getElementById('participantMeetingId');
    
    if (!meetingDisplay) return;

    let meetingId = localStorage.getItem('CURRENT_MEETING') || '';
    let meetingTitle = localStorage.getItem('CURRENT_MEETING_TITLE') || 'Unknown Meeting';

    // ✅ Auto-populate the meeting ID input field
    if (meetingIdInput && meetingId) {
      meetingIdInput.value = meetingId;
      console.log(`✅ [Participants] Auto-populated Meeting ID input: ${meetingId.substring(0, 8)}...`);
    }

    if (meetingId) {
      meetingDisplay.innerHTML = `<strong>${meetingTitle}</strong> <span style="color: #666; font-family: monospace;">(${meetingId.substring(0, 8)}...)</span>`;
      console.log(`✅ [Participants] Meeting info displayed: ${meetingTitle}`);
    } else {
      meetingDisplay.innerHTML = '<em>No meeting selected</em>';
      console.log('ℹ️ [Participants] No meeting selected yet');
    }
  }

  setupEventListeners() {
    // Ensure modal is hidden on init
    const modal = document.getElementById('participantModal');
    if (modal) {
      modal.classList.remove('show');
    }

    // Add participant button
    const createBtn = document.getElementById('createParticipantBtn') || document.getElementById('newParticipantBtn');
    if (createBtn) {
      createBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openParticipantModal();
      });
    }

    // Form submission
    const form = document.getElementById('participantForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveParticipant();
      });
    }

    // Modal close buttons
    const cancelBtn = document.getElementById('cancelParticipantBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.closeParticipantModal();
      });
    }

    const closeBtn = document.getElementById('closeParticipantModal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closeParticipantModal();
      });
    }

    // Search and filters
    const searchBox = document.getElementById('searchParticipants');
    if (searchBox) {
      searchBox.addEventListener('input', () => {
        this.filterParticipants();
      });
    }

    const entityTypeSelect = document.getElementById('participantEntityType');
    if (entityTypeSelect) {
      entityTypeSelect.value = this.entityType;
      entityTypeSelect.addEventListener('change', async (e) => {
        this.entityType = e.target.value || 'inceptions';
        await this.loadParticipants();
      });
    }

    const meetingIdInput = document.getElementById('participantMeetingId');
    if (meetingIdInput) {
      const storedMeeting = localStorage.getItem('CURRENT_MEETING') || '';
      if (storedMeeting) {
        meetingIdInput.value = storedMeeting;
      }
      meetingIdInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          await this.loadParticipants();
        }
      });
    }

    const loadBtn = document.getElementById('btnLoadParticipants');
    if (loadBtn) {
      loadBtn.addEventListener('click', async () => {
        await this.loadParticipants();
      });
    }

    // ✅ NEW: Change Meeting button - allow manual override
    const changeMeetingBtn = document.getElementById('changeMeetingBtn');
    if (changeMeetingBtn) {
      changeMeetingBtn.addEventListener('click', () => {
        const meetingIdInput = document.getElementById('participantMeetingId');
        if (meetingIdInput) {
          meetingIdInput.focus();
          meetingIdInput.select();
        }
      });
    }
  }

  async loadParticipants() {
    try {
      // Get meetingId from explicit input or localStorage fallback
      const meetingIdInput = document.getElementById('participantMeetingId');
      let meetingId = meetingIdInput?.value?.trim() || localStorage.getItem('CURRENT_MEETING');
      this.meetingId = meetingId;

      if (meetingId) {
        localStorage.setItem('CURRENT_MEETING', meetingId);
      }

      console.log(`📋 [Participants] loadParticipants called - entityType=${this.entityType}, meetingId=${meetingId}`);

      // If no meeting ID, show empty state
      if (!meetingId) {
        console.log('ℹ️ [Participants] No meeting selected - participants list is empty');
        console.log('💡 Tip: Click a meeting on the Meetings page first to auto-load');
        this.participants = [];
        this.renderParticipants();
        return;
      }

      console.log(`👥 [Participants] Loading participants for entityType=${this.entityType}, meetingId=${meetingId.substring(0, 8)}...`);

      // Call service with entityType and meetingId
      // Service returns array directly (handles response wrapper internally)
      const participants = await participantsService.listParticipants(this.entityType, meetingId);
      console.log(`📦 [Participants] Raw response from service:`, participants);
      console.log(`📦 [Participants] Is array? ${Array.isArray(participants)}, Length: ${participants?.length || 0}`);
      
      this.participants = Array.isArray(participants) ? participants : [];
      console.log(`✅ [Participants] Set this.participants to:`, this.participants);
      
      this.filterParticipants();
      this.renderParticipants();
    } catch (error) {
      console.error('❌ [Participants] Failed to load participants:', error);
      this.participants = [];
      this.renderParticipants();
    }
  }

  filterParticipants() {
    const search = document.getElementById('searchParticipants')?.value?.toLowerCase() || '';

    console.log(`🔍 [filterParticipants] Starting filter with search="${search}"`);
    console.log(`📦 [filterParticipants] Total participants before filter: ${this.participants.length}`);
    console.log(`📋 [filterParticipants] Participants data:`, this.participants);

    this.filteredParticipants = this.participants.filter(participant => {
      // Search by userId, roleDescription, or any user info
      const matchesSearch = !search || 
        (participant.userId?.toLowerCase().includes(search)) ||
        (participant.roleDescription?.toLowerCase().includes(search)) ||
        (participant.userName?.toLowerCase().includes(search));
      
      return matchesSearch;
    });

    console.log(`✅ [filterParticipants] Filtered to: ${this.filteredParticipants.length} participants`);
    this.renderParticipants();
  }

  renderParticipants() {
    const tbody = document.getElementById('participantsBody');
    if (!tbody) {
      console.error('❌ [renderParticipants] participantsBody element not found!');
      return;
    }

    console.log(`🎨 [renderParticipants] Starting render with ${this.filteredParticipants.length} participants`);
    console.log(`📊 [renderParticipants] Filtered participants:`, this.filteredParticipants);

    if (!Array.isArray(this.filteredParticipants) || this.filteredParticipants.length === 0) {
      console.warn('⚠️ [renderParticipants] No participants to display');
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center;">
            <div class="empty-state">
              <div class="empty-icon">👥</div>
              <h3>No Participants</h3>
              <p>No participants added yet. Click "Add Participant" to add one.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const html = this.filteredParticipants.map(participant => {
      console.log(`📝 [renderParticipants] Rendering participant:`, participant);
      
      // Backend returns: displayName (not userName), role (not roleDescription)
      const name = participant.displayName || participant.userName || 'N/A';
      const role = participant.roleDescription || participant.role || 'Participant';
      
      return `
      <tr>
        <td><strong>${participant.userId}</strong></td>
        <td>${name}</td>
        <td>
          <span class="badge badge-secondary">${role}</span>
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-secondary" onclick="window.participantsPage.editParticipant('${participant._id}')">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="window.participantsPage.deleteParticipant('${participant._id}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
    }).join('');
    
    tbody.innerHTML = html;
    console.log(`✅ [renderParticipants] Rendered ${this.filteredParticipants.length} participants successfully`);
  }

  openParticipantModal(participantId = null) {
    this.editingParticipantId = participantId;
    const modal = document.getElementById('participantModal');
    const form = document.getElementById('participantForm');

    if (participantId) {
      // Edit mode
      document.getElementById('modalTitle').textContent = 'Edit Participant';
      const participant = this.participants.find(p => p._id === participantId);
      if (participant) {
        document.getElementById('participantUserId').value = participant.userId || '';
        document.getElementById('participantRoleDescription').value = participant.roleDescription || '';
      }
    } else {
      // Create mode
      document.getElementById('modalTitle').textContent = 'Add Participant';
      form.reset();
    }

    modal.classList.add('show');
  }

  closeParticipantModal() {
    const modal = document.getElementById('participantModal');
    modal.classList.remove('show');
    this.editingParticipantId = null;
    document.getElementById('participantForm').reset();
  }

  async saveParticipant() {
    try {
      const userIdVal = document.getElementById('participantUserId')?.value?.trim();
      const roleDescriptionVal = document.getElementById('participantRoleDescription')?.value?.trim();

      // Backend REQUIRES userId (USR-prefixed like "USR1100000")
      if (!userIdVal) {
        alert('User ID is required (e.g., USR1100000)');
        return;
      }

      if (!this.meetingId) {
        alert('No meeting selected');
        return;
      }

      const participantData = {
        userId: userIdVal,
        ...(roleDescriptionVal && { roleDescription: roleDescriptionVal })
      };

      let response;
      if (this.editingParticipantId) {
        // UPDATE participant - pass meetingId instead of participantId
        response = await participantsService.updateParticipant(
          this.entityType,
          this.meetingId,  // ✅ Changed from editingParticipantId to meetingId
          participantData
        );
        console.log('✅ Participant updated:', response);
        alert('Participant updated successfully!');
      } else {
        // ADD participant to meeting
        response = await participantsService.addParticipant(
          this.entityType,
          this.meetingId,
          participantData
        );
        console.log('✅ Participant added:', response);
        alert('Participant added successfully!');
      }

      this.closeParticipantModal();
      await this.loadParticipants();
    } catch (error) {
      console.error('Failed to save participant:', error);
      alert(`Failed to save participant: ${error.message}`);
    }
  }

  async editParticipant(participantId) {
    this.openParticipantModal(participantId);
  }

  async deleteParticipant(participantId) {
    if (confirm('Are you sure you want to remove this participant?')) {
      try {
        console.log(`🗑️ [deleteParticipant] Attempting to delete participant: ${participantId}`);
        
        // Find the participant to get userId
        const participant = this.participants.find(p => p._id === participantId);
        if (!participant) {
          console.error('❌ [deleteParticipant] Participant not found:', participantId);
          alert('Participant not found');
          return;
        }

        console.log(`📋 [deleteParticipant] Found participant:`, participant);
        console.log(`🔄 [deleteParticipant] Calling removeParticipant with userId: ${participant.userId}, meetingId: ${this.meetingId}`);
        
        // Call remove with proper data structure (meetingId in path, userId in body)
        const response = await participantsService.removeParticipant(
          this.entityType,
          this.meetingId,  // ✅ meetingId in path
          { userId: participant.userId }  // ✅ userId in body
        );
        
        console.log(`✅ [deleteParticipant] Response:`, response);
        alert('Participant removed successfully!');
        await this.loadParticipants();
      } catch (error) {
        console.error('❌ [deleteParticipant] Failed to delete:', error);
        alert(`Failed to remove participant: ${error.message}`);
      }
    }
  }
}

// Initialize page
const participantsPage = new ParticipantsPage();
window.participantsPage = participantsPage;

export { ParticipantsPage };
