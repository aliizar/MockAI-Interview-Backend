-- CreateTable
CREATE TABLE "InterviewPreference" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Software Developer',
    "difficulty" TEXT NOT NULL DEFAULT 'Intermediate',
    "interviewType" TEXT NOT NULL DEFAULT 'Mixed',
    "duration" INTEGER NOT NULL DEFAULT 30,
    "rememberHistory" BOOLEAN NOT NULL DEFAULT true,
    "recommendations" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InterviewPreference_userId_key" ON "InterviewPreference"("userId");

-- AddForeignKey
ALTER TABLE "InterviewPreference" ADD CONSTRAINT "InterviewPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
