// reCAPTCHA Enterprise Site Key
const SITE_KEY = '6LcPkjAsAAAAAElRZLBofF_bbHjBIs0bUX78Pt6K';

/**
 * Executes a reCAPTCHA Enterprise challenge and returns the token.
 * @param action The action name for the challenge (e.g., 'login', 'signup', 'password_reset').
 * @returns A promise that resolves to the reCAPTCHA token.
 */
export const getRecaptchaToken = async (action: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof grecaptcha === 'undefined' || !grecaptcha.enterprise) {
      console.error('reCAPTCHA script not loaded or invalid.');
      reject(new Error('reCAPTCHA service unavailable.'));
      return;
    }

    grecaptcha.enterprise.ready(async () => {
      try {
        const token = await grecaptcha.enterprise.execute(SITE_KEY, { action });
        #console.log(`[reCAPTCHA] Generated token for action '${action}':`, token);
        resolve(token);
      } catch (error) {
        console.error('reCAPTCHA execution failed:', error);
        reject(error);
      }
    });
  });
};

