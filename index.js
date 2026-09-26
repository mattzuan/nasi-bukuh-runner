const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS
  });
}

function bearerToken(request) {
  const value = request.headers.get("Authorization") || "";
  return value.startsWith("Bearer ") ? value.slice(7) : "";
}

function authorized(request, expected) {
  const supplied = bearerToken(request);
  return Boolean(expected && supplied && supplied === expected);
}

function validNumber(value, min, max) {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === "/") {
      return json({
        success: true,
        service: "NASI BUKUH RUNNER API",
        version: "V1",
        time: new Date().toISOString()
      });
    }

    if (url.pathname === "/api/location" && request.method === "POST") {
      if (!authorized(request, env.RUNNER_TOKEN)) {
        return json({ success: false, error: "Unauthorized" }, 401);
      }

      let data;
      try {
        data = await request.json();
      } catch {
        return json({ success: false, error: "Invalid JSON" }, 400);
      }

      const runnerId = String(data.runnerId || "").trim();
      const latitude = Number(data.latitude);
      const longitude = Number(data.longitude);
      const accuracy = Number(data.accuracy || 0);
      const speed = Number(data.speed || 0);
      const heading = Number(data.heading || 0);

      if (!runnerId || runnerId.length > 30) {
        return json({ success: false, error: "Invalid runnerId" }, 400);
      }

      if (!validNumber(latitude, -90, 90) ||
          !validNumber(longitude, -180, 180)) {
        return json({ success: false, error: "Invalid GPS coordinates" }, 400);
      }

      const record = {
        runnerId,
        latitude,
        longitude,
        accuracy: Number.isFinite(accuracy) ? accuracy : 0,
        speed: Number.isFinite(speed) ? speed : 0,
        heading: Number.isFinite(heading) ? heading : 0,
        status: "ONLINE",
        lastSeen: new Date().toISOString()
      };

      await env.LOCATIONS.put(
        `runner:${runnerId}`,
        JSON.stringify(record)
      );

      return json({ success: true, data: record });
    }

    if (url.pathname === "/api/stop" && request.method === "POST") {
      if (!authorized(request, env.RUNNER_TOKEN)) {
        return json({ success: false, error: "Unauthorized" }, 401);
      }

      let data;
      try {
        data = await request.json();
      } catch {
        return json({ success: false, error: "Invalid JSON" }, 400);
      }

      const runnerId = String(data.runnerId || "").trim();
      if (!runnerId) {
        return json({ success: false, error: "Invalid runnerId" }, 400);
      }

      const existing = await env.LOCATIONS.get(`runner:${runnerId}`, "json");

      const record = {
        ...(existing || {}),
        runnerId,
        status: "OFFLINE",
        lastSeen: new Date().toISOString()
      };

      await env.LOCATIONS.put(
        `runner:${runnerId}`,
        JSON.stringify(record)
      );

      return json({ success: true, data: record });
    }

    if (url.pathname === "/api/location" && request.method === "GET") {
      if (!authorized(request, env.ADMIN_TOKEN)) {
        return json({ success: false, error: "Unauthorized" }, 401);
      }

      const runnerId = (url.searchParams.get("runnerId") || "R001").trim();
      const record = await env.LOCATIONS.get(`runner:${runnerId}`, "json");

      if (!record) {
        return json({ success: true, data: null });
      }

      const lastSeenMs = new Date(record.lastSeen).getTime();
      const ageSeconds = Number.isFinite(lastSeenMs)
        ? Math.max(0, (Date.now() - lastSeenMs) / 1000)
        : Infinity;

      const output = { ...record };

      // V1 safety rule: if no location update for 45s, show OFFLINE.
      if (ageSeconds > 45) output.status = "OFFLINE";

      output.ageSeconds = Math.round(ageSeconds);

      return json({ success: true, data: output });
    }

    return json({ success: false, error: "Endpoint not found" }, 404);
  }
};
