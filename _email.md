**Subject: Re: Help Needed: Capturing Client's Public IP for Contract Signing (Frontend Team Follow-up)**

Hi Backend & Contract Service Teams,

Thanks for looping us in on the IP address issue for contract signing. After reviewing our frontend application, we have some important findings and a clear recommendation on how to solve this correctly.

**How the Frontend Signing Process Works**

When a client clicks the "Li e Aceito os Termos" (I have read and accept the terms) button on the public signing page, our application triggers a `POST` request directly to your endpoint: `/contract-api/sign/{contractDbId}`.

The payload of this request includes the `client_id`, `client_phone_number`, and a `device_info` object containing the browser's `user_agent`. The frontend application itself cannot reliably determine the user's public IP address. While we could call an external third-party API to get the IP, this is not a robust solution as it introduces unnecessary dependencies, potential failures, and security risks.

**The Recommended Solution: Read the `X-Forwarded-For` Header on the Backend**

The correct and standard industry practice is to capture the client's IP on the backend. Since our services are running on GCP Cloud Run, Google's load balancer automatically captures the end-user's public IP address and forwards it to your service in the **`X-Forwarded-For`** HTTP header.

The `169.254.x.x` IP address you are currently seeing is an internal metadata IP from Google's infrastructure. This confirms that your service is receiving the request but is not looking at the correct header for the original client IP.

Your backend application simply needs to be configured to read the IP from the `X-Forwarded-For` header instead of the direct source IP of the request. Most web frameworks have standard mechanisms to handle this when running behind a proxy or load balancer.

**How to Verify and Debug**

To help you troubleshoot, you can inspect the full details of incoming requests to your service using **GCP Logs Explorer**. This will allow you to see all the headers, including `X-Forwarded-For`, and confirm the client's public IP is present.

Here is a sample query you can use in GCP Logs Explorer to filter for requests to the signing endpoint:

```
resource.type="cloud_run_revision"
resource.labels.service_name="<YOUR_BACKEND_API_SERVICE_NAME>" // e.g., "backend-api"
httpRequest.requestUrl=~"/contract-api/sign/"
```

When you inspect the logs for these requests, expand the `httpRequest` field to view the full request headers. You should find the `X-Forwarded-For` header containing the actual public IP of the user who signed the contract.

This server-side approach will solve the problem reliably without requiring any changes on the frontend. Please let us know if you have any questions.

Thanks,
The Frontend Team
