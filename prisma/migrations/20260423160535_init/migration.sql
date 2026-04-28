-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('ADMINISTRADOR', 'SEPARADOR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "codigo" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "foto" TEXT,
    "perfil" "Perfil" NOT NULL,
    "senha" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "resetToken" TEXT,
    "resetTokenExp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_codigo_key" ON "User"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
