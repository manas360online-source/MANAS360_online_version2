import React from 'react';
import { Link } from 'react-router-dom';

type Props = {
  role?: string;
};

const Sidebar: React.FC<Props> = ({ role }) => {
  const isPsychologist = role === 'psychologist';
  return (
    <nav className="w-60 bg-white border-r h-screen sticky top-0 p-4 hidden md:block">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <img src="/Untitled.png" alt="MANAS360 logo" className="h-7 w-7 rounded-md object-cover" />
          <div className="text-2xl font-semibold text-indigo-700">MANAS360</div>
        </div>
        <div className="text-sm text-gray-500 mt-1">{isPsychologist ? 'Psychologist Console' : 'Therapist Console'}</div>
      </div>

      <ul className="space-y-2">
        {isPsychologist ? (
          <>
            <li>
              <Link to="/psychologist/dashboard" className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link to="/psychologist/patients" className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                <span>Assigned Patients</span>
              </Link>
            </li>
            <li>
              <Link to="/psychologist/assessments" className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                <span>Assessments</span>
              </Link>
            </li>
            <li>
              <Link to="/psychologist/reports" className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                <span>Reports</span>
              </Link>
            </li>
            <li>
              <Link to="/psychologist/tests" className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                <span>Tests</span>
              </Link>
            </li>
            <li>
              <Link to="/psychologist/schedule" className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                <span>Schedule</span>
              </Link>
            </li>
            <li>
              <Link to="/psychologist/messages" className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                <span>Messages</span>
              </Link>
            </li>
            <li>
              <Link to="/psychologist/settings" className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                <span>Settings</span>
              </Link>
            </li>
          </>
        ) : (
          <>
            <li>
              <a className="flex items-center gap-3 p-2 rounded hover:bg-gray-50" href="#">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                <span>Sessions</span>
              </a>
            </li>
            <li>
              <a className="flex items-center gap-3 p-2 rounded hover:bg-gray-50" href="#">
                <span>Patients</span>
              </a>
            </li>
            <li>
              <Link to="/therapist/analytics" className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                <span>Analytics</span>
              </Link>
            </li>
            <li>
              <a className="flex items-center gap-3 p-2 rounded hover:bg-gray-50" href="#">
                <span>Settings</span>
              </a>
            </li>
          </>
        )}
      </ul>

      <div className="mt-8 text-xs text-gray-500">Account</div>
      <div className="mt-2">
        <div className="flex items-center gap-3 p-2 rounded">
          <div className="w-8 h-8 rounded-full bg-gray-200" />
          <div>
            <div className="text-sm font-medium">Dr. Sharma</div>
            <div className="text-xs text-gray-500">{role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Therapist'}</div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
