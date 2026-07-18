type UploadedImageOperation<T> = {
  upload(): Promise<void>;
  operation(): Promise<T>;
  cleanup(): Promise<void>;
};

export async function withUploadedImageCleanup<T>({
  upload,
  operation,
  cleanup,
}: UploadedImageOperation<T>) {
  let uploadAttempted = false;
  try {
    uploadAttempted = true;
    await upload();
    return await operation();
  } catch (error) {
    if (uploadAttempted) {
      try {
        await cleanup();
      } catch {
        // Cleanup is best-effort; preserve the original ingestion failure.
      }
    }
    throw error;
  }
}
