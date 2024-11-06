'use client'

import { useState, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { Card } from "./components/ui/card"
import { Checkbox } from "./components/ui/checkbox"
import { Label } from "./components/ui/label"
import { ChevronLeftIcon, ChevronRightIcon, EyeIcon, EyeOffIcon, CheckIcon, XIcon } from 'lucide-react'
import './globals.css'
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';

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
const [isDarkMode, setIsDarkMode] = useState(false)

useEffect(() => {
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    setIsDarkMode(true);
  } else {
    document.documentElement.classList.remove('dark');
    setIsDarkMode(false);
  }
}, []);

const toggleDarkMode = () => {
  if (document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.remove('dark');
    localStorage.theme = 'light';
    setIsDarkMode(false);
  } else {
    document.documentElement.classList.add('dark');
    localStorage.theme = 'dark';
    setIsDarkMode(true);
  }
};

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
  }
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
                  const correctAnswerArray = flashcards[currentCardIndex].correctAnswer.split(',').map(a => a.trim().toLowerCase());
                  const allowMultipleAnswers = correctAnswerArray.length > 1;
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
          <Label htmlFor={`answer-${index}`} className="text-muted-foreground">
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
  <div className="app min-h-screen bg-background flex flex-col items-center justify-center p-4">
    <Card className="w-full max-w-md h-[80vh] flex flex-col bg-card rounded-xl border border-border shadow-2xl">
      <h1 className="text-3xl font-bold text-center text-foreground py-4">
        Flaszkards
      </h1>
      {flashcards.length === 0 && (
<div className="mb-10 text-center">
  
  <p className="text-lg mb-10 font-semibold text-primary">Upload an Excel file to start studying with flashcards!</p>
  <Input
    type="file"
    accept=".xlsx,.csv"
    onChange={handleFileUpload}
    ref={fileInputRef}
    className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 mb-10"
  />
  <div className="text-sm text-muted-foreground">
    <h3 className="mb-1">The Excel file should have three columns:</h3>
    <p><span className="font-semibold">Question:</span> (include "(Choose X)" for multiple answers)</p>
    <p><span className="font-semibold">Possible Answers:</span> comma-separated</p>
    <p><span className="font-semibold">Correct Answer:</span> comma-separated lowercase letters</p>
  </div>
</div>
)}

      {flashcards.length > 0 && (
        <div className="flex-grow overflow-y-auto p-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">Question:</h2>
          <p className="text-foreground mb-6">{flashcards[currentCardIndex].question}</p>
          <h3 className="text-xl font-semibold mb-3 text-primary">
            Possible Answers
            {flashcards[currentCardIndex].correctAnswer.split(',').map(a => a.trim().toLowerCase()).length > 1 && (
              <span> (Select multiple answers)</span>
            )}
          </h3>
          <div className="text-foreground mb-6">
            {formatPossibleAnswers(flashcards[currentCardIndex].possibleAnswers)}
          </div>
          {answerSubmitted && (
            <div className="mt-2 flex items-center">
              {selectedAnswers.every(answer => flashcards[currentCardIndex].correctAnswer.toLowerCase().includes(answer.toLowerCase())) &&
              selectedAnswers.length === flashcards[currentCardIndex].correctAnswer.split(',').length ? (
                <CheckIcon className="text-accent mr-2" />
              ) : (
                <XIcon className="text-destructive mr-2 " />
              )}
              <span className="text-foreground text-right">
                {selectedAnswers.every(answer => flashcards[currentCardIndex].correctAnswer.toLowerCase().includes(answer.toLowerCase())) &&
                selectedAnswers.length === flashcards[currentCardIndex].correctAnswer.split(',').length ? "Correct!" : "Incorrect"}
              </span>
            </div>
          )}
          {showAnswer && (
            <div className="mt-6 bg-muted bg-opacity-50 p-4 rounded-lg">
              <h3 className="text-xl font-semibold mb-2 text-primary">Correct Answer:</h3>
              <p className="text-foreground text-lg">
                {flashcards[currentCardIndex].correctAnswer.split(',').map(answer => answer.trim().toUpperCase()).join(', ')}
              </p>
            </div>
          )}
        </div>
      )}
      <Button
            onClick={answerSubmitted ? toggleShowAnswer : handleAnswerSubmit}
            className="mt-4 mr-4 ml-4"
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
      {flashcards.length > 0 && (<div className="flex justify-between p-4">
        <Button 
          onClick={handlePreviousCard} 
          disabled={currentCardIndex === 0}
        >
        <ChevronLeftIcon className="mr-2 h-4 w-4" /> Previous
        </Button>
        <div className="text-center text-muted-foreground">
              <p>Card {currentCardIndex + 1} of {flashcards.length}</p>
              <p>Score: {calculateScore()}% ({correctAnswers}/{totalAttempts})</p>        
        </div>
        <Button 
          onClick={handleNextCard} 
          disabled={currentCardIndex === flashcards.length - 1}
        >
          Next <ChevronRightIcon className="ml-2 h-4 w-4" />
        </Button>
      </div>)}
    </Card>
    <button
      onClick={toggleDarkMode}
      className="fixed top-4 right-4 p-2 rounded-md bg-secondary"
    >
      {isDarkMode ? (
        <MoonIcon className="h-6 w-6 text-muted-foreground" />       
      ) : (
        <SunIcon className="h-6 w-6 text-primary" />
      )}
    </button>
  </div>
)
}
