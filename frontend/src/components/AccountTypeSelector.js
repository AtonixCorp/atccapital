import React, { useState } from 'react';
import './AccountTypeSelector.css';
import { FaUser, FaBuilding } from 'react-icons/fa';

const AccountTypeSelector = ({ onSelect }) => {
  const [selectedType, setSelectedType] = useState(null);

  const handleSelect = (type) => {
    setSelectedType(type);
    onSelect(type);
  };

  return (
    <div className="account-type-selector-container">
      <div className="selector-content">
        <h2 className="selector-title">How would you like to use Atonix Capital?</h2>
        <p className="selector-subtitle">Choose the experience that best fits your needs</p>

        <div className="account-type-grid">
          {/* Personal Account */}
          <div
            className={`account-type-card ${selectedType === 'personal' ? 'selected' : ''}`}
            onClick={() => handleSelect('personal')}
          >
            <div className="icon-container personal-icon">
              <FaUser size={48} />
            </div>
            <h3>Personal</h3>
            <p className="description">Manage your own finances</p>
            <ul className="features">
              <li>Track income & expenses</li>
              <li>Manage your tax across countries</li>
              <li>Monitor multiple countries</li>
              <li>Personal insights & alerts</li>
              <li>Budget planning</li>
            </ul>
            <span className="cta-text">Select Personal</span>
          </div>

          {/* Enterprise Account */}
          <div
            className={`account-type-card ${selectedType === 'enterprise' ? 'selected' : ''}`}
            onClick={() => handleSelect('enterprise')}
          >
            <div className="icon-container enterprise-icon">
              <FaBuilding size={48} />
            </div>
            <h3>Enterprise</h3>
            <p className="description">Manage multiple entities & teams</p>
            <ul className="features">
              <li>Multi-entity management</li>
              <li>Team collaboration</li>
              <li>Role-based access control</li>
              <li>Consolidated tax & compliance</li>
              <li>Advanced reporting</li>
            </ul>
            <span className="cta-text">Select Enterprise</span>
          </div>
        </div>

        <div className="selector-note">
          <p>💡 <strong>Tip:</strong> You can change your account type later in settings.</p>
        </div>
      </div>
    </div>
  );
};

export default AccountTypeSelector;
