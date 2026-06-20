import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CustomSelect = ({
  value,
  onChange,
  options,
  children,
  placeholder = 'Select...',
  disabled = false,
  style = {},
  className = '',
  dropdownStyle = {},
  variant = 'standard' // 'standard' or 'borderless'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse options from array or children
  const parsedOptions = React.useMemo(() => {
    if (options && options.length > 0) {
      return options.map(opt => {
        if (typeof opt === 'string') {
          return { value: opt, label: opt };
        }
        return opt;
      });
    }

    const opts = [];
    React.Children.forEach(children, child => {
      if (React.isValidElement(child) && child.type === 'option') {
        opts.push({
          value: child.props.value,
          label: child.props.children || child.props.value
        });
      }
    });
    return opts;
  }, [options, children]);

  const selectedOption = parsedOptions.find(opt => String(opt.value) === String(value));

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (val) => {
    if (disabled) return;
    setIsOpen(false);
    if (onChange) {
      // Mimic an HTML change event to make it a drop-in replacement
      onChange({ target: { value: val } });
    }
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // Helper to split layout properties and inner styling properties
  const splitStyle = (styleObj = {}) => {
    const containerStyle = {};
    const innerStyle = {};

    const containerKeys = [
      'flex', 'flexGrow', 'flexShrink', 'flexBasis',
      'width', 'minWidth', 'maxWidth',
      'height', 'minHeight', 'maxHeight',
      'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
      'display', 'position', 'top', 'right', 'bottom', 'left',
      'verticalAlign', 'alignSelf', 'justifySelf', 'gridArea',
      'gridColumn', 'gridRow'
    ];

    Object.keys(styleObj).forEach(key => {
      if (containerKeys.includes(key)) {
        containerStyle[key] = styleObj[key];
      } else {
        innerStyle[key] = styleObj[key];
      }
    });

    return { containerStyle, innerStyle };
  };

  const { containerStyle, innerStyle } = splitStyle(style);

  // Choose base styles based on variant
  const getTriggerStyles = () => {
    const baseStyles = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontFamily: 'Outfit, sans-serif',
      fontSize: '0.85rem',
      fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      opacity: disabled ? 0.6 : 1,
      height: '100%',
      width: '100%',
      userSelect: 'none',
      boxSizing: 'border-box'
    };

    if (variant === 'borderless') {
      return {
        ...baseStyles,
        background: 'transparent',
        border: 'none',
        padding: '8px 10px',
        color: 'var(--primary-navy)',
        ...innerStyle
      };
    }

    // Standard variant
    return {
      ...baseStyles,
      background: '#FFFFFF',
      border: isOpen ? '2px solid var(--teal)' : '2px solid var(--sky-blue)',
      borderRadius: '12px',
      padding: '8px 12px',
      color: 'var(--primary-navy)',
      boxShadow: isOpen ? '0 0 0 3px rgba(86, 124, 141, 0.15)' : 'none',
      ...innerStyle
    };
  };

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${className} ${disabled ? 'disabled' : ''}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        width: '100%',
        boxSizing: 'border-box',
        zIndex: isOpen ? 1000 : 1,
        ...containerStyle
      }}
    >
      <div
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={toggleDropdown}
        style={getTriggerStyles()}
      >
        <span style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginRight: '8px'
        }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          style={{
            color: 'var(--primary-teal)',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0
          }}
        />
      </div>

      {isOpen && (
        <div
          className="custom-select-dropdown animate-fadeInDown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: '100%',
            background: '#FFFFFF',
            border: '1px solid var(--sky-blue-light)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-float)',
            zIndex: 'var(--z-dropdown)',
            maxHeight: '220px',
            overflowY: 'auto',
            padding: '4px',
            boxSizing: 'border-box',
            ...dropdownStyle
          }}
        >
          {parsedOptions.length === 0 ? (
            <div style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontFamily: 'Outfit, sans-serif' }}>
              No options available
            </div>
          ) : (
            parsedOptions.map((opt) => {
              const isSelected = selectedOption && String(opt.value) === String(selectedOption.value);
              return (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? 'var(--primary-navy)' : 'var(--text-secondary)',
                    background: isSelected ? 'rgba(86, 124, 141, 0.08)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    marginBottom: '2px',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(200, 217, 230, 0.3)';
                      e.currentTarget.style.color = 'var(--primary-navy)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {opt.label}
                  </span>
                  {isSelected && (
                    <Check size={14} style={{ color: 'var(--primary-teal)', marginLeft: '8px', flexShrink: 0 }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
