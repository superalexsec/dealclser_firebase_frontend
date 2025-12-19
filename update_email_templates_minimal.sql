UPDATE email_templates
SET
    subject = 'Bem-vindo ao Próximo Negócio - Verifique seu e-mail',
    body = '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; color: #333;"><div style="background-color: #f4f4f4; padding: 20px;"><div style="background-color: #fff; padding: 20px; border-radius: 5px; border-top: 5px solid #1976d2; text-align: center;"><img src="https://proximonegocio.com.br/logo_main.png" alt="Próximo Negócio" width="120" style="margin-bottom: 20px;"><h2 style="color: #1976d2;">Bem-vindo ao Próximo Negócio!</h2><p>Estamos felizes em ter você conosco.</p><p>Por favor, use o código abaixo para verificar seu endereço de e-mail:</p><div style="background-color: #e9ecef; padding: 10px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0; color: #000;">{otp}</div><p>Este código expira em 15 minutos.</p><p style="font-size: 12px; color: #777;">Se você não solicitou esta verificação, por favor ignore este e-mail.</p><br><p>Atenciosamente,</p><p><strong>Equipe Próximo Negócio</strong></p></div></div></body></html>',
    updated_at = NOW()
WHERE template_name = 'verify_email';

UPDATE email_templates
SET
    subject = 'Próximo Negócio: Código de Verificação',
    body = '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; color: #333;"><div style="background-color: #f4f4f4; padding: 20px;"><div style="background-color: #fff; padding: 20px; border-radius: 5px; border-top: 5px solid #d32f2f; text-align: center;"><img src="https://proximonegocio.com.br/logo_main.png" alt="Próximo Negócio" width="120" style="margin-bottom: 20px;"><h2 style="color: #d32f2f;">Verificação de Segurança</h2><p>Seu código de verificação é:</p><div style="background-color: #e9ecef; padding: 10px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0; color: #000;">{otp}</div><p>Este código expira às {expiration}.</p><p style="font-size: 12px; color: #777;">Se você não está tentando acessar sua conta ou realizar uma alteração, por favor entre em contato com o suporte imediatamente.</p><br><p>Atenciosamente,</p><p><strong>Equipe Próximo Negócio</strong></p></div></div></body></html>',
    updated_at = NOW()
WHERE template_name = 'mfa_verify';

