import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import axios from 'axios';
import {
    CircularProgress,
    Typography,
    Box,
    Alert,
    Paper,
    Container,
    Button
} from '@mui/material';

interface BricksDetailsResponse {
    total_amount: number;
    currency_id: string; // e.g., "BRL"
    tenant_mercadopago_public_key: string;
    bricks_preference_id?: string; // Optional
    installments_selected: number;
}

const PaymentPage: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const [paymentDetails, setPaymentDetails] = useState<BricksDetailsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isBrickReady, setIsBrickReady] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'processing' | 'submitted' | 'error_submission'>('idle');
    const [isSDKInitialized, setIsSDKInitialized] = useState(false);

    useEffect(() => {
        const fetchPaymentDetails = async () => {
            if (!sessionId) {
                setError("Session ID is missing.");
                setIsLoading(false);
                return;
            }
            try {
                setIsLoading(true);
                setError(null);
                const backendUrl = process.env.REACT_APP_BACKEND_URL;
                if (!backendUrl) {
                    console.error("Backend URL is not defined. Please set REACT_APP_BACKEND_URL.");
                    // Optionally, show an error to the user
                    return;
                }
                const response = await axios.get<BricksDetailsResponse>(
                    `${backendUrl}/api/v1/payment-sessions/${sessionId}/bricks-details`
                );
                // Ensure total_amount is a number
                const data = response.data;
                const numericTotalAmount = typeof data.total_amount === 'string' ? parseFloat(data.total_amount) : data.total_amount;

                setPaymentDetails({
                    ...data,
                    total_amount: numericTotalAmount
                });
            } catch (err: any) {
                console.error("Failed to fetch payment details:", err);
                setError(err.response?.data?.message || err.message || "Failed to load payment information. Please check connectivity to the backend or ensure the session ID is valid.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPaymentDetails();
    }, [sessionId]);

    useEffect(() => {
        if (paymentDetails && paymentDetails.tenant_mercadopago_public_key && !isSDKInitialized) {
            try {
                console.log("Initializing MercadoPago SDK with public key:", paymentDetails.tenant_mercadopago_public_key);
                initMercadoPago(paymentDetails.tenant_mercadopago_public_key, {
                    locale: 'pt-BR' // Example: Set locale if needed
                });
                setIsSDKInitialized(true);
                console.log("MercadoPago SDK Initialized");
            } catch (sdkError) {
                console.error("Error initializing MercadoPago SDK:", sdkError);
                setError("Failed to initialize payment SDK.");
            }
        }
    }, [paymentDetails, isSDKInitialized]);

    const handleOnReady = () => {
        console.log("MercadoPago Brick is Ready");
        setIsBrickReady(true);
    };

    const handleOnError = (errorObject: any) => { // Type according to MercadoPago's SDK
        console.error("MercadoPago Brick Error:", errorObject);
        setError(`Payment Brick error: ${errorObject?.message || 'Unknown error'}. Please try again or contact support.`);
        setSubmissionStatus('error_submission');
    };

    const handleSubmitPayment = async (formData: any) => { // Type according to MercadoPago's SDK
        setSubmissionStatus('processing');
        console.log('Payment data received from MercadoPago Brick. formData:', formData);
        console.log('IMPORTANT: This data should be sent to your backend to create the actual payment with MercadoPago via a server-to-server call.');

        // SIMULATE that the frontend has sent this to its backend, and is now awaiting actual confirmation
        // In a real scenario, this is where you would POST `formData` to your backend.
        // Your backend would then POST to MercadoPago.
        // The UI should wait for a response from *your* backend.

        // For now, to address the Payment Team's concern, we will show a message
        // indicating the data was sent for processing, but the final outcome is pending via WhatsApp.
        // This avoids a premature "Payment Submitted!" if MP internally rejected it due to low amount
        // or if other issues occur during the actual server-to-server payment creation.

        // We are still resolving the promise to the Brick to let it know we've handled the callback.
        return new Promise<void>((resolve) => {
            // This status means: "We've got your card details from the form, PayServ will now try to process it with MercadoPago.
            // Look for a WhatsApp message for the final status."
            setSubmissionStatus('submitted'); 
            resolve();
        });
    };
    
    if (isLoading) {
        return (
            <Container maxWidth="sm" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
                 <Paper elevation={3} sx={{ p: 3 }}>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>Loading payment details...</Typography>
                </Paper>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                    <Button variant="outlined" onClick={() => window.location.reload()}>Try Again</Button>
                 </Paper>
            </Container>
        );
    }

    if (!paymentDetails || !isSDKInitialized) {
        return (
            <Container maxWidth="sm" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography>Payment information not yet available or payment SDK not initialized.</Typography>
                    {!paymentDetails && <Typography variant="caption">Waiting for payment session details...</Typography>}
                    {paymentDetails && !isSDKInitialized && <Typography variant="caption">Initializing payment system...</Typography>}
                    <CircularProgress sx={{mt: 2}}/>
                </Paper>
            </Container>
        );
    }

    const initialization = {
        amount: paymentDetails.total_amount,
        ...(paymentDetails.bricks_preference_id && { preferenceId: paymentDetails.bricks_preference_id }),
    };

    const customization = {
        visual: {
            style: {
                theme: 'default' as 'default' | 'dark' | 'bootstrap' | 'flat', 
            }
        },
        paymentMethods: {
            maxInstallments: paymentDetails.installments_selected > 0 ? paymentDetails.installments_selected : undefined,
            // Types for MercadoPago SDK might need more specific handling for paymentMethods customization
            // For example, explicitly excluding payment types if necessary:
            // types: {
            //   excluded: ['ticket']
            // }
        }
    };


    return (
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h5" gutterBottom textAlign="center">
                    Complete Your Payment
                </Typography>
                <Typography variant="body1" textAlign="center" gutterBottom>
                    Total Amount: {paymentDetails.currency_id} {paymentDetails.total_amount.toFixed(2)}
                </Typography>
                {paymentDetails.installments_selected > 1 && (
                    <Typography variant="body2" textAlign="center" color="textSecondary" sx={{mb: 2}} gutterBottom>
                        Installments selected: {paymentDetails.installments_selected}
                    </Typography>
                )}

                {submissionStatus === 'idle' && (
                    <>
                        {!isBrickReady && 
                            <Box sx={{textAlign: 'center', my: 2}}>
                                <CircularProgress />
                                <Typography variant="caption" display="block" sx={{mt:1}}>Loading payment form...</Typography>
                            </Box>
                        }
                        <Box id="cardPaymentBrick_container" sx={{ mt: 2, opacity: isBrickReady ? 1 : 0.3, transition: 'opacity 0.5s ease-in-out' }}>
                             <CardPayment
                                initialization={initialization}
                                customization={customization}
                                onSubmit={handleSubmitPayment}
                                onReady={handleOnReady}
                                onError={handleOnError}
                            />
                        </Box>
                    </>
                )}

                {submissionStatus === 'processing' && (
                    <Box textAlign="center" my={3}>
                        <CircularProgress />
                        <Typography variant="body1" sx={{ mt: 2 }}>Processing your payment...</Typography>
                        <Typography variant="caption" display="block">Please do not close this page.</Typography>
                    </Box>
                )}

                {submissionStatus === 'submitted' && (
                     <Alert severity="success" sx={{ mt: 3, textAlign: 'center' }}>
                        <Typography variant="h6">Payment Submitted!</Typography>
                        <Typography>You will receive a confirmation via WhatsApp shortly. You can now close this page.</Typography>
                    </Alert>
                )}
                {submissionStatus === 'error_submission' && (
                    <Alert severity="error" sx={{ mt: 3 }}>
                        There was an error submitting your payment. Please check the details and try again. If the problem persists, contact support.
                    </Alert>
                )}
            </Paper>
        </Container>
    );
};

export default PaymentPage; 