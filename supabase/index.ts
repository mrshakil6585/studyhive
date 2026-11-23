
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
 
  return new Response(
    JSON.stringify({
      message: "StudyHive AI function is ready!",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
});
