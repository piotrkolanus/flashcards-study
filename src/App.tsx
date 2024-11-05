'use client'

import { useState, useRef} from 'react'
import * as XLSX from 'xlsx'
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { Card } from "./components/ui/card"
import { Checkbox } from "./components/ui/checkbox"
import { Label } from "./components/ui/label"
import { ChevronLeftIcon, ChevronRightIcon, EyeIcon, EyeOffIcon, CheckIcon, XIcon } from 'lucide-react'

interface Flashcard {
question: string
possibleAnswers: string
correctAnswer: string
}

export default function FlashcardApp() {
const [flashcards, setFlashcards] = useState<Flashcard[]>([])
const [currentCardIndex, setCurrentCardIndex] = useState(0)
const [showAnswer, setShowAnswer] = useState(false)
const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
const [correctAnswers, setCorrectAnswers] = useState(0)
const [totalAttempts, setTotalAttempts] = useState(0)
const [answerSubmitted, setAnswerSubmitted] = useState(false)
const fileInputRef = useRef<HTMLInputElement>(null)

const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: ['question', 'possibleAnswers', 'correctAnswer'] })
      setFlashcards(jsonData as Flashcard[])
      resetState()
    }
    reader.readAsArrayBuffer(file)
  }
}

const resetState = () => {
  setCurrentCardIndex(0)
  setShowAnswer(false)
  setSelectedAnswers([])
  setCorrectAnswers(0)
  setTotalAttempts(0)
  setAnswerSubmitted(false)
}

const handleNextCard = () => {
  if (currentCardIndex < flashcards.length - 1) {
    setCurrentCardIndex(currentCardIndex + 1)
    setShowAnswer(false)
    setSelectedAnswers([])
    setAnswerSubmitted(false)
  }
}

const handlePreviousCard = () => {
  if (currentCardIndex > 0) {
    setCurrentCardIndex(currentCardIndex - 1)
    setShowAnswer(false)
    setSelectedAnswers([])
    setAnswerSubmitted(false)
  }
}

const toggleShowAnswer = () => {
  setShowAnswer(!showAnswer)
}

const handleAnswerSubmit = () => {
  if (selectedAnswers.length > 0 && !answerSubmitted) {
    setTotalAttempts(totalAttempts + 1)
    const correctAnswerArray = flashcards[currentCardIndex].correctAnswer.split(',').map(a => a.trim().toLowerCase())
    const isCorrect = selectedAnswers.length === correctAnswerArray.length &&
      selectedAnswers.every(answer => correctAnswerArray.includes(answer.toLowerCase()))
    if (isCorrect) {
      setCorrectAnswers(correctAnswers + 1)
    }
    setAnswerSubmitted(true)
    setShowAnswer(true)
  }
}

const getRequiredAnswerCount = (question: string) => {
  const match = question.match(/\(Choose (\d+)\)$/)
  return match ? parseInt(match[1]) : 1
}

const formatPossibleAnswers = (answers: string) => {
  return answers.split(',').map((answer, index) => {
    const letter = String.fromCharCode(65 + index)
    return (
      <div key={index} className="mb-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`answer-${index}`}
            checked={selectedAnswers.includes(letter)}
            onCheckedChange={(checked) => {
              if (checked) {
                setSelectedAnswers(prev => {
                  // Get the correct answer for the current card
                  const correctAnswerArray = flashcards[currentCardIndex].correctAnswer.split(',').map(a => a.trim().toLowerCase());
            
                  // Check if multiple answers are allowed
                  const allowMultipleAnswers = correctAnswerArray.length > 1;
            
                  // Allow selection if multiple answers are allowed or if the current selection count is less than the correct answer count
                  if (allowMultipleAnswers || prev.length < correctAnswerArray.length) {
                    return [...prev, letter];
                  }
                  return prev;
                });
              } else {
                setSelectedAnswers(prev => prev.filter(a => a !== letter));
              }
            }}
            disabled={answerSubmitted}
          />
          <Label htmlFor={`answer-${index}`} className="text-white">
            <span className="font-semibold">{letter}. </span>
            {answer.trim()}
          </Label>
        </div>
      </div>
    )
  })
}

const calculateScore = () => {
  return totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0
}

return (
  <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-900 flex flex-col items-center justify-center p-4">
    <Card className="w-full max-w-md p-6 bg-black bg-opacity-30 backdrop-filter backdrop-blur-lg rounded-xl border border-purple-500 shadow-2xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
        Futuristic Flashcards
      </h1>
      <div className="mb-6">
        <Input
          type="file"
          accept=".xlsx,.csv"
          onChange={handleFileUpload}
          ref={fileInputRef}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 text-white"
        />
      </div>
      {flashcards.length > 0 ? (
        <div className="mt-6">
          <div className="flashcard bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 w-full">
            <h2 className="text-2xl font-semibold mb-4 text-pink-300">Question:</h2>
            <p className="text-white mb-6">{flashcards[currentCardIndex].question}</p>
            <h3 className="text-xl font-semibold mb-3 text-pink-300">
Possible Answers
{flashcards[currentCardIndex].correctAnswer.split(',').map(a => a.trim().toLowerCase()).length > 1 && (
  <span> (Select multiple answers)</span>)}:
</h3>
            <div className="text-white mb-6">
              {formatPossibleAnswers(flashcards[currentCardIndex].possibleAnswers)}
            </div>
            {showAnswer && (
              <div className="mt-6 bg-purple-700 bg-opacity-50 p-4 rounded-lg">
                <h3 className="text-xl font-semibold mb-2 text-pink-300">Correct Answer(s):</h3>
                <p className="text-white text-lg">
                  {flashcards[currentCardIndex].correctAnswer.split(',').map(answer => answer.trim().toUpperCase()).join(', ')}
                </p>
                {answerSubmitted && (
                  <div className="mt-2 flex items-center">
                    {selectedAnswers.every(answer => flashcards[currentCardIndex].correctAnswer.toLowerCase().includes(answer.toLowerCase())) &&
                    selectedAnswers.length === flashcards[currentCardIndex].correctAnswer.split(',').length ? (
                      <CheckIcon className="text-green-500 mr-2" />
                    ) : (
                      <XIcon className="text-red-500 mr-2" />
                    )}
                    <span className="text-white">
                      {selectedAnswers.every(answer => flashcards[currentCardIndex].correctAnswer.toLowerCase().includes(answer.toLowerCase())) &&
                      selectedAnswers.length === flashcards[currentCardIndex].correctAnswer.split(',').length ? "Correct!" : "Incorrect"}
                    </span>
                  </div>
                )}
              </div>
            )}
            <Button
              onClick={answerSubmitted ? toggleShowAnswer : handleAnswerSubmit}
              className="mt-6 bg-pink-500 hover:bg-pink-600 text-white w-full"
              disabled={selectedAnswers.length === 0 && !answerSubmitted}
            >
              {answerSubmitted ? (
                showAnswer ? (
                  <>
                    <EyeOffIcon className="mr-2 h-4 w-4" /> Hide Answer
                  </>
                ) : (
                  <>
                    <EyeIcon className="mr-2 h-4 w-4" /> Show Answer
                  </>
                )
              ) : (
                "Submit Answer"
              )}
            </Button>
          </div>
          <div className="flex justify-between mt-6">
            <Button 
              onClick={handlePreviousCard} 
              disabled={currentCardIndex === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <ChevronLeftIcon className="mr-2 h-4 w-4" /> Previous
            </Button>
            <Button 
              onClick={handleNextCard} 
              disabled={currentCardIndex === flashcards.length - 1}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Next <ChevronRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="text-center mt-4 text-white">
            <p>Card {currentCardIndex + 1} of {flashcards.length}</p>
            <p className="mt-2">Score: {calculateScore()}% ({correctAnswers}/{totalAttempts})</p>
          </div>
        </div>
      ) : (
        <div className="text-center text-white">
          <p className="mb-4">Upload an Excel file to start studying with flashcards!</p>
          <p className="text-sm">The Excel file should have three columns:</p>
          <p className="text-sm">Question (include "(Choose X)" for multiple answers), Possible Answers (comma-separated), and Correct Answer(s) (comma-separated lowercase letters)</p>
        </div>
      )}
    </Card>
  </div>
)
}
