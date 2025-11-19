/**
 * Get actual audio duration from an audio blob
 * Uses HTML5 Audio API to measure duration
 */
export async function getAudioDuration(audioBlob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(audioBlob);
    
    audio.addEventListener('loadedmetadata', () => {
      const duration = audio.duration;
      URL.revokeObjectURL(url);
      resolve(duration);
    });
    
    audio.addEventListener('error', (error) => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load audio: ${error}`));
    });
    
    audio.src = url;
  });
}

/**
 * Get duration of audio from URL
 */
export async function getAudioDurationFromUrl(audioUrl: string): Promise<number> {
  try {
    const response = await fetch(audioUrl);
    const blob = await response.blob();
    return await getAudioDuration(blob);
  } catch (error: any) {
    throw new Error(`Failed to get audio duration: ${error.message}`);
  }
}

