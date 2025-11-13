import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Read accessToken from httpOnly cookie (set by /api/token)
  const accessToken = req.cookies.get("accessToken")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Unauthorized: accessToken not found" },
      { status: 401 }
    );
  }

  try {
    const users: Array<{ userId: string; userName: string }> = [];
    let cursor: string | null | undefined = undefined;

    // Loop until nextCursor is null/empty
    do {
      const url: string = cursor
        ? `https://www.worksapis.com/v1.0/users?cursor=${encodeURIComponent(
            cursor
          )}`
        : "https://www.worksapis.com/v1.0/users";
      const res: Response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.text();
        console.error("WorksAPI error:", res.status, res.statusText);
        console.error("WorksAPI error response:", errorData);
        return NextResponse.json(
          { error: "Failed to fetch users from WorksAPI", details: errorData },
          { status: res.status }
        );
      }

      const data: any = await res.json();

      const pageUsers = (data.users || []).map((user: any) => ({
        userId: user.userId,
        userName: user.userName
          ? `${user.userName.lastName || ""} ${
              user.userName.firstName || ""
            }`.trim()
          : user.name || "Unknown",
      }));

      users.push(...pageUsers);

      cursor = data.responseMetaData?.nextCursor ?? null;
    } while (cursor);

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
