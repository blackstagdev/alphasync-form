import { google } from "googleapis";

export async function POST({ request }) {
    try {
        const contentType = request.headers.get("content-type") || "";
        let body = {};

        // 🟨 If the form is submitted as JSON
        if (contentType.includes("application/json")) {
            body = await request.json();
        }
        // 🟩 If the form is submitted as multipart/form-data (your case)
        else if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            body = Object.fromEntries(formData.entries());
        }
        // ❌ Unsupported
        else {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Unsupported content type"
                }),
                { status: 400 }
            );
        }

        console.log("Parsed Body:", body); // <— DEBUG

        // Google Auth
        const auth = new google.auth.JWT({
            email: process.env.GOOGLE_CLIENT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            scopes: ["https://www.googleapis.com/auth/spreadsheets"]
        });

        const sheets = google.sheets({ version: "v4", auth });

        const spreadsheetId = "1WtfS-LcD2IJLRTkzQKdb1bvQFA9TzES1crHJE7vkqyg";

        // Checkbox normalization
        const agree =
            body.agree === "true" ||
            body.agree === "on" ||
            body.agree === "1" ||
            body.agree === true;

        const row = [
            new Date().toISOString(),
            body.firstName || "",
            body.lastName || "",
            body.suffix || "",
            body.email || "",
            body.phone || "",
            body.companyName || "",
            body.businessType || "",
            body.website || "",
            body.taxId || "",
            body.npi || "",
            body.npiMatchesContact || "",
            body.hasResellerLicense || "",
            body.resellerPermit || "",
            body.resellerCertificate || "",
            body.address || "",
            body.city || "",
            body.state || "",
            body.zip || "",
            body.proofOfBusiness || "",
            body.referredBy || "",
            body.notes || "",
            agree ? "Yes" : "No"
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: "Provider!A1",
            valueInputOption: "RAW",
            requestBody: {
                values: [row]
            }
        });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("GOOGLE SHEETS ERROR:", error);
        return new Response(
            JSON.stringify({ success: false, error: String(error) }),
            { status: 500 }
        );
    }
}
