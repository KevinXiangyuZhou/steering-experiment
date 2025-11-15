// Function to extract URL parameters
export const getUrlParameters = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    prolificPid: urlParams.get('PROLIFIC_PID') || null,
    studyId: urlParams.get('STUDY_ID') || null,
    sessionId: urlParams.get('SESSION_ID') || null
  };
};

