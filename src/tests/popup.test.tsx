import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Popup, formatTimeSinceLastAccess } from '../popup/index';

// Mock the chrome API for tests
beforeAll(() => {
  global.chrome = {
    storage: {
      sync: {
        get: jest.fn((_keys, cb) => cb({})),
        set: jest.fn((_, cb) => cb && cb()),
      },
    },
    runtime: {
      sendMessage: jest.fn((_msg, cb) => cb && cb({ suggestions: [] })),
    },
    tabs: {
      query: jest.fn((_query, cb) => cb && cb([])),
    },
    windows: {
      getCurrent: jest.fn((cb) => cb && cb({ id: 1 })),
    },
  } as any;
});

// Table-driven scenarios for rendering
const renderScenarios = [
  {
    name: 'renders the Inactive heading',
    setup: () => {},
    assertion: () => expect(screen.getByText('Inactive')).toBeInTheDocument(),
  },
  {
    name: 'shows the settings button',
    setup: () => {},
    assertion: () => expect(screen.getByTitle('Settings')).toBeInTheDocument(),
  },
  {
    name: 'shows the File Bugs button',
    setup: () => {},
    assertion: () => expect(screen.getByTitle('File Bugs')).toBeInTheDocument(),
  },
];

describe('Popup Component - Rendering', () => {
  it.each(renderScenarios)('$name', ({ setup, assertion }) => {
    setup();
    render(<Popup />);
    assertion();
  });
});

// Table-driven scenarios for time formatting
const timeScenarios: { minutes: number; expected: string; comment: string }[] = [
  { minutes: 5, expected: '5 minutes ago', comment: 'Shows minutes for < 1 hour' },
  { minutes: 120, expected: '2 hours ago', comment: 'Shows hours for < 1 day' },
  { minutes: 2880, expected: '2 days ago', comment: 'Shows days for >= 1 day' },
];

describe('Popup Component - Time Formatting', () => {
  it.each(timeScenarios)(
    '$comment',
    ({ minutes, expected }) => {
      expect(formatTimeSinceLastAccess(minutes)).toBe(expected);
    }
  );
});

it('opens the bug report form in a new tab', () => {
  const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
  render(<Popup />);
  fireEvent.click(screen.getByTitle('File Bugs'));
  expect(openSpy).toHaveBeenCalled();
  openSpy.mockRestore();
}); 