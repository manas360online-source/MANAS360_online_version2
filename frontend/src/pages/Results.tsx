import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../lib/http';

export const ResultsPage: React.FC = () => {
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadLatestResult = async () => {
    setLoading(true);

    try {
      const response = await http.get('/v1/patients/me/assessments', {
        params: {
          page: 1,
          limit: 1,
        },
      });

      const latest = response.data?.data?.items?.[0] || null;
      setData(latest);
    } catch (err) {
      console.error('Failed to load result', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLatestResult();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading result...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button
          onClick={() => navigate('/free-screening')}
          className="text-blue-500 underline"
        >
          Complete Assessment First
        </button>
      </div>
    );
  }

  const severity = data.severityLevel || 'Assessment Complete';
  const totalScore = data.totalScore ?? 'N/A';
  const type = data.type || 'Assessment';

  let emoji = '😊';
  let color = 'text-emerald-600';
  let message = 'Your assessment is complete.';

  if (String(severity).toLowerCase() === 'severe') {
    emoji = '😞';
    color = 'text-red-500';
    message = 'Your score suggests significant symptoms. Professional support is recommended.';
  } else if (String(severity).toLowerCase().includes('moderate')) {
    emoji = '😟';
    color = 'text-orange-500';
    message = 'Your score suggests moderate symptoms. Speaking with a professional may help.';
  } else if (String(severity).toLowerCase() === 'mild') {
    emoji = '🙂';
    color = 'text-amber-600';
    message = 'Your score suggests mild symptoms. Self-care and monitoring may help.';
  }

  return (
    <div className="responsive-page bg-wellness-bg animate-fadeIn">
      <div className="responsive-container section-stack py-8 sm:py-12">

        <div className="w-full max-w-screen-lg mx-auto flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
          <div
            className="font-serif text-2xl font-normal text-wellness-text tracking-wide cursor-pointer hover:opacity-80 transition-smooth"
            onClick={() => navigate('/')}
          >
            MANAS<span className="font-semibold text-calm-sage">360</span>
          </div>

          <div className="text-sm font-medium text-gentle-blue bg-gentle-blue/15 px-5 py-2 rounded-full">
            Results
          </div>
        </div>

        <div className="w-full max-w-screen-md mx-auto bg-white rounded-[40px] shadow-soft-xl border border-calm-sage/10 p-6 sm:p-10 md:p-14 text-center">

          <div className="text-7xl mb-6 animate-float">{emoji}</div>

          <h1 className="font-serif text-4xl text-wellness-text mb-3 font-light">
            {severity}
          </h1>

          <p className={`text-lg font-medium mb-10 ${color}`}>
            {message}
          </p>

          <div className="bg-wellness-surface rounded-3xl p-10 text-left mb-14 border border-calm-sage/10">
            <h3 className="text-xs font-bold text-wellness-muted uppercase tracking-widest mb-6">
              Summary Analysis
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-wellness-muted mb-2">
                  Assessment Type
                </p>
                <p className="text-xl font-serif text-wellness-text font-medium">
                  {type}
                </p>
              </div>

              <div>
                <p className="text-sm text-wellness-muted mb-2">
                  Total Score
                </p>
                <p className="text-xl font-serif text-wellness-text font-medium">
                  {totalScore}
                </p>
              </div>

              <div className="col-span-1 md:col-span-2">
                <p className="text-sm text-wellness-muted mb-3">
                  Completed At
                </p>
                <p className="text-base text-wellness-text">
                  {data.createdAt
                    ? new Date(data.createdAt).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="section-stack">
            <div className="flex flex-col md:flex-row gap-4 w-full">
              <button
                onClick={() => navigate('/patient/onboarding/booking-prompt')}
                className="group flex-1 min-h-[3rem] px-6 bg-white border-2 border-calm-sage text-calm-sage rounded-full font-sans font-semibold text-base md:text-lg transition-smooth hover:bg-calm-sage hover:text-white"
              >
                Book a session
              </button>

              <button
                onClick={() => navigate('/free-screening')}
                className="group flex-1 min-h-[3rem] px-6 bg-white border-2 border-gentle-blue text-gentle-blue rounded-full font-sans font-semibold text-base md:text-lg transition-smooth hover:bg-gentle-blue hover:text-white"
              >
                Retake Assessment
              </button>
            </div>

            <button
              onClick={() => navigate('/patient/dashboard')}
              className="responsive-action-btn w-full bg-wellness-surface border-2 border-calm-sage/20 text-wellness-text rounded-full font-sans font-medium text-base"
            >
              Go to Dashboard
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};