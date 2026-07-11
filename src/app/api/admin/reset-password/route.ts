import { NextRequest, NextResponse } from "next/server";
import { verifyResetToken, markTokenUsed, hashPassword, updatePassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token e nova senha sao obrigatorios" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 8 caracteres" },
        { status: 400 }
      );
    }

    const userId = await verifyResetToken(token);
    if (!userId) {
      return NextResponse.json(
        { error: "Token invalido ou expirado" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(newPassword);
    await updatePassword(userId, passwordHash);
    await markTokenUsed(token);

    return NextResponse.json({
      success: true,
      message: "Senha redefinida com sucesso",
    });
  } catch (error) {
    console.error("[Reset Password API] Error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
