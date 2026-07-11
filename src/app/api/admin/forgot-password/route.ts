import { NextRequest, NextResponse } from "next/server";
import { getAdminByEmail, createResetToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email e obrigatorio" },
        { status: 400 }
      );
    }

    const user = await getAdminByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Se o email estiver cadastrado, voce recebera um link de redefinicao.",
      });
    }

    const resetToken = await createResetToken(user.id);

    // In production, send email with reset link
    // For now, log the token for development
    console.log(`[Password Reset] Token for ${email}: ${resetToken}`);
    console.log(`[Password Reset] Reset URL: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/reset-password?token=${resetToken}`);

    return NextResponse.json({
      success: true,
      message: "Se o email estiver cadastrado, voce recebera um link de redefinicao.",
      // Include token in dev mode for testing
      ...(process.env.NODE_ENV !== "production" && { resetToken }),
    });
  } catch (error) {
    console.error("[Forgot Password API] Error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
