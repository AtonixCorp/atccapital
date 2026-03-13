import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { entityStaffAPI, entityDepartmentsAPI, entityRolesAPI } from '../../../services/api';

const StaffHR = () => {
  const { entityId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = searchParams.get('section') || 'people';
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    department: 'all',
    employment_type: 'all',
  });

  const [staffMembers, setStaffMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals / UI state
  const [showAddRole, setShowAddRole] = useState(false);
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);

  const loadAll = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    setError('');
    try {
      const [staffRes, rolesRes, deptsRes] = await Promise.all([
        entityStaffAPI.getAll({ entity: entityId }),
        entityRolesAPI.getAll({ entity: entityId }),
        entityDepartmentsAPI.getAll({ entity: entityId }),
      ]);
      setStaffMembers(staffRes.data.results || staffRes.data);
      setRoles(rolesRes.data.results || rolesRes.data);
      setDepartments(deptsRes.data.results || deptsRes.data);
    } catch (e) {
      setError('Failed to load HR data. Please try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [entityId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const computeInitials = (first, last) => {
    return `${(first || '').charAt(0)}${(last || '').charAt(0)}`.toUpperCase() || 'U';
  };

  const addRole = async (roleData) => {
    try {
      await entityRolesAPI.create({ ...roleData, entity: parseInt(entityId) });
      await loadAll();
      setShowAddRole(false);
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to create role.');
    }
  };

  const addDepartment = async (deptData) => {
    try {
      await entityDepartmentsAPI.create({ ...deptData, entity: parseInt(entityId) });
      await loadAll();
      setShowAddDepartment(false);
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to create department.');
    }
  };

  const addStaff = async (staffData) => {
    try {
      await entityStaffAPI.create({ ...staffData, entity: parseInt(entityId) });
      await loadAll();
      setShowAddStaff(false);
    } catch (e) {
      const msg = e.response?.data?.email?.[0]
        || e.response?.data?.employee_id?.[0]
        || e.response?.data?.detail
        || Object.values(e.response?.data || {})[0]?.[0]
        || 'Failed to add staff member.';
      alert(msg);
    }
  };

  const deleteStaff = async (id) => {
    if (!window.confirm('Remove this staff member?')) return;
    try {
      await entityStaffAPI.delete(id);
      setStaffMembers(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      alert('Failed to remove staff member.');
    }
  };

  // Render People Directory
  const renderPeople = () => (
    <div className="hr-people-section">
      {/* Search and Filters */}
      <div className="people-controls">
        <div className="search-bar">

          <input
            type="text"
            placeholder="Search staff by name, role, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="terminated">Terminated</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={filters.department}
            onChange={(e) => setFilters({...filters, department: e.target.value})}
          >
            <option value="all">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={filters.employment_type}
            onChange={(e) => setFilters({...filters, employment_type: e.target.value})}
          >
            <option value="all">All Types</option>
            <option value="full_time">Full Time</option>
            <option value="part_time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="consultant">Consultant</option>
          </select>

          <button className="btn-primary" onClick={() => setShowAddStaff(true)}>
            Add Staff
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Staff Stats */}
      <div className="people-stats">
        <div className="stat-card">
          <div className="stat-content">
            <h3>{staffMembers.length}</h3>
            <p>Total Staff</p>
          </div>
        </div>
        <div className="stat-card active">
          <div className="stat-content">
            <h3>{staffMembers.filter(s => s.status === 'active').length}</h3>
            <p>Active</p>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-content">
            <h3>{staffMembers.filter(s => s.status === 'on_leave').length}</h3>
            <p>On Leave</p>
          </div>
        </div>
        <div className="stat-card info">
          <div className="stat-content">
            <h3>{staffMembers.filter(s => s.employment_type === 'contract').length}</h3>
            <p>Contractors</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading staff...</div>
      ) : staffMembers.length === 0 ? (
        <div className="empty-state"><p>No staff members found. Add your first staff member.</p></div>
      ) : (
      /* Staff Cards Grid */
      <div className="staff-grid">
        {staffMembers
          .filter(s => filters.status === 'all' || s.status === filters.status)
          .filter(s => filters.department === 'all' || String(s.department) === String(filters.department))
          .filter(s => filters.employment_type === 'all' || s.employment_type === filters.employment_type)
          .filter(s => !searchTerm || s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.email?.toLowerCase().includes(searchTerm.toLowerCase()) || s.role_name?.toLowerCase().includes(searchTerm.toLowerCase()))
          .map(staff => (
          <div key={staff.id} className={`staff-card ${staff.status}`}>
            <div className="staff-header">
              <div className="staff-avatar">{computeInitials(staff.first_name, staff.last_name)}</div>
              <div className="staff-info">
                <h3>{staff.full_name || `${staff.first_name} ${staff.last_name}`}</h3>
                <p className="staff-role">{staff.role_name || '—'}</p>
                <p className="staff-department">{staff.department_name || '—'}</p>
              </div>
              <span className={`status-badge ${staff.status}`}>
                {staff.status === 'active' && 'Active'}
                {staff.status === 'on_leave' && 'On Leave'}
                {staff.status === 'terminated' && 'Terminated'}
                {staff.status === 'inactive' && 'Inactive'}
              </span>
            </div>

            <div className="staff-details">
              <div className="detail-row">
                <span>{staff.email}</span>
              </div>
              <div className="detail-row">
                <span>{staff.employment_type?.replace('_', ' ')}</span>
              </div>
              {staff.hire_date && (
                <div className="detail-row">
                  <span>Since {new Date(staff.hire_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="staff-actions">
              <button className="action-btn view" disabled title="Staff detail view not yet available">
                View
              </button>
              <button className="action-btn delete" onClick={() => deleteStaff(staff.id)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );

  // Render Roles & Permissions
  const renderRoles = () => (
    <div className="hr-roles-section">
      <div className="roles-header">
        <h2>Roles & Permissions</h2>
        <div style={{display:'flex', gap:8}}>
          <button className="btn-secondary" onClick={() => setShowAddDepartment(true)}>
            + Dept
          </button>
          <button className="btn-primary" onClick={() => setShowAddRole(true)}>
            Create Role
          </button>
        </div>
      </div>

      {/* Role Cards */}
      <div className="roles-grid">
        {roles.length === 0 ? (
          <div className="empty-state"><p>No roles defined yet. Create your first role.</p></div>
        ) : roles.map(role => (
          <div key={role.id} className="role-card">
            <div className="role-header">
              <h3>{role.name}</h3>
              {role.code && <span className="role-code">{role.code}</span>}
            </div>
            <p className="role-description">{role.description}</p>
            <div className="role-stats">
              <div className="stat">
                <span>{role.staff_count ?? 0} staff</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Permissions list */}
      <div className="permissions-matrix">
        <h3>Roles Overview</h3>
        <div className="matrix-table">
          <table>
            <thead>
              <tr>
                <th>Role</th>
                <th>Code</th>
                <th>Staff Count</th>
                <th>Department</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(role => (
                <tr key={role.id}>
                  <td className="role-name">{role.name}</td>
                  <td>{role.code || '—'}</td>
                  <td>{role.staff_count ?? 0}</td>
                  <td>{role.department_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Render Contracts & Compliance
  const renderContracts = () => (
    <div className="hr-contracts-section">
      <div className="contracts-header">
        <h2>Contracts & Compliance</h2>
      </div>

      {/* Contract Timeline */}
      <div className="contract-timeline">
        <h3>Contract Timeline</h3>
        <div className="timeline">
          {staffMembers.filter(s => s.status !== 'terminated').map(staff => (
            <div key={staff.id} className="timeline-item">
              <div className="timeline-marker">
                <div className={`marker-dot ${staff.status}`}></div>
              </div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <h4>{staff.full_name || `${staff.first_name} ${staff.last_name}`}</h4>
                  <span className="timeline-date">
                    {staff.hire_date && new Date(staff.hire_date).toLocaleDateString()}
                  </span>
                </div>
                <p>{staff.role_name || '—'} • {staff.employment_type?.replace('_', ' ')}</p>
                {staff.termination_date && (
                  <div className="expiry-warning">
                    <span>End: {new Date(staff.termination_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Departments */}
      <div className="compliance-dashboard">
        <h3>Departments ({departments.length})</h3>
        <div className="compliance-grid">
          {departments.map(d => (
            <div key={d.id} className="compliance-card complete">
              <h4>{d.name}</h4>
              <p>{d.staff_count ?? 0} staff</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render Performance & Payroll
  const renderPerformance = () => (
    <div className="hr-performance-section">
      <div className="performance-header">
        <h2>Performance & Payroll Intelligence</h2>
      </div>

      {/* Performance Dashboard */}
      <div className="performance-dashboard">
        <h3>Performance Overview</h3>
        <div className="performance-grid">
          {staffMembers.filter(s => s.performance).map(staff => (
            <div key={staff.id} className="performance-card">
              <div className="perf-header">
                <div className="perf-avatar">{computeInitials(staff.first_name, staff.last_name)}</div>
                <div className="perf-info">
                  <h4>{staff.full_name || `${staff.first_name} ${staff.last_name}`}</h4>
                  <p>{staff.role_name || '—'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payroll Intelligence */}
      <div className="payroll-intelligence">
        <h3>Payroll Intelligence</h3>
        <div className="payroll-table">
          <table>
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Employment Type</th>
                <th>Base Salary</th>
                <th>Currency</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {staffMembers.filter(s => s.salary).map(staff => (
                <tr key={staff.id}>
                  <td>
                    <div className="staff-cell">
                      <div className="staff-mini-avatar">{computeInitials(staff.first_name, staff.last_name)}</div>
                      <span>{staff.full_name || `${staff.first_name} ${staff.last_name}`}</span>
                    </div>
                  </td>
                  <td>{staff.employment_type?.replace('_', ' ')}</td>
                  <td>{Number(staff.salary).toLocaleString()}</td>
                  <td>{staff.currency}</td>
                  <td><span className={`status-badge ${staff.status}`}>{staff.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'people': return renderPeople();
      case 'roles': return renderRoles();
      case 'contracts': return renderContracts();
      case 'performance': return renderPerformance();
      default: return renderPeople();
    }
  };

  /* Modals: Add Role / Department / Staff */
  const RoleModal = ({ onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = () => {
      if (!name || !code) { alert('Name and code are required.'); return; }
      onSubmit({ name, code, description });
    };

    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h3>Create Role</h3>
            <button className="btn-link" onClick={onClose}>Close</button>
          </div>
          <div className="modal-body">
            <div className="form-row">
              <label>Role Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Finance Manager" />
            </div>
            <div className="form-row">
              <label>Code *</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. finance_manager" />
            </div>
            <div className="form-row">
              <label>Description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-primary" onClick={handleSubmit}>Create Role</button>
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  const DepartmentModal = ({ onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h3>Add Department</h3>
            <button className="btn-link" onClick={onClose}>Close</button>
          </div>
          <div className="modal-body">
            <div className="form-row">
              <label>Department Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Finance" />
            </div>
            <div className="form-row">
              <label>Code *</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. finance" />
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-primary" onClick={() => { if (!name || !code) { alert('Name and code are required.'); return; } onSubmit({ name, code }); }}>Add</button>
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  const StaffModal = ({ onClose, onSubmit }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [roleVal, setRoleVal] = useState(roles[0]?.id || '');
    const [departmentVal, setDepartmentVal] = useState(departments[0]?.id || '');
    const [salary, setSalary] = useState('');
    const [hireDate, setHireDate] = useState(new Date().toISOString().split('T')[0]);
    const [employmentType, setEmploymentType] = useState('full_time');

    const handleSubmit = () => {
      if (!firstName || !lastName || !email || !employeeId || !hireDate) {
        alert('First name, last name, email, employee ID, and hire date are required.');
        return;
      }
      onSubmit({
        first_name: firstName,
        last_name: lastName,
        email,
        employee_id: employeeId,
        role: roleVal || null,
        department: departmentVal || null,
        salary: salary ? Number(salary) : null,
        hire_date: hireDate,
        employment_type: employmentType,
      });
    };

    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h3>Add Staff Member</h3>
            <button className="btn-link" onClick={onClose}>Close</button>
          </div>
          <div className="modal-body">
            <p style={{fontSize:'12px',color:'#666',marginBottom:8}}>Note: The email must match a registered user account.</p>
            <div className="form-row">
              <label>First Name *</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="form-row">
              <label>Last Name *</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div className="form-row">
              <label>Email * (must be a registered user)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-row">
              <label>Employee ID *</label>
              <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="e.g. EMP-001" />
            </div>
            <div className="form-row">
              <label>Role</label>
              <select value={roleVal} onChange={(e) => setRoleVal(e.target.value)}>
                <option value="">— None —</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>Department</label>
              <select value={departmentVal} onChange={(e) => setDepartmentVal(e.target.value)}>
                <option value="">— None —</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>Employment Type</label>
              <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="consultant">Consultant</option>
              </select>
            </div>
            <div className="form-row">
              <label>Hire Date *</label>
              <input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
            </div>
            <div className="form-row">
              <label>Salary</label>
              <input value={salary} onChange={(e) => setSalary(e.target.value)} type="number" />
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-primary" onClick={handleSubmit}>Add Staff</button>
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="staff-hr-module">
      {/* Page Header */}
      <div className="page-header-hr">
        <div className="header-content-hr">
          <h1>Staff & HR Management</h1>
          <p>Comprehensive people, contracts, and performance management</p>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="section-navigation-hr">
        <button
          className={`nav-btn ${activeSection === 'people' ? 'active' : ''}`}
          onClick={() => setSearchParams({ section: 'people' })}
        >
          People Directory
        </button>
        <button
          className={`nav-btn ${activeSection === 'roles' ? 'active' : ''}`}
          onClick={() => setSearchParams({ section: 'roles' })}
        >
          Roles & Permissions
        </button>
        <button
          className={`nav-btn ${activeSection === 'contracts' ? 'active' : ''}`}
          onClick={() => setSearchParams({ section: 'contracts' })}
        >
          Contracts & Compliance
        </button>
        <button
          className={`nav-btn ${activeSection === 'performance' ? 'active' : ''}`}
          onClick={() => setSearchParams({ section: 'performance' })}
        >
          Performance & Payroll
        </button>
      </div>

      {/* Main Content */}
      <div className="hr-content">
        {renderContent()}
        {showAddRole && (
          <RoleModal onClose={() => setShowAddRole(false)} onSubmit={addRole} />
        )}
        {showAddDepartment && (
          <DepartmentModal onClose={() => setShowAddDepartment(false)} onSubmit={addDepartment} />
        )}
        {showAddStaff && (
          <StaffModal onClose={() => setShowAddStaff(false)} onSubmit={addStaff} />
        )}
      </div>
    </div>
  );
};

export default StaffHR;
