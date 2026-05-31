# -*- coding: utf-8 -*-
"""
Guess Number Game - The computer picks a random number, you guess it.
"""
import random


def guess_number():
    low = 1
    high = 100
    secret = random.randint(low, high)
    attempts = 0

    print(f"Game started! I'm thinking of a number between {low} and {high}.")

    while True:
        try:
            guess = int(input("Enter your guess: "))
        except ValueError:
            print("Please enter a valid integer!")
            continue

        attempts += 1

        if guess < secret:
            print("Too low, try higher!")
        elif guess > secret:
            print("Too high, try lower!")
        else:
            print(f"You got it! The number is {secret}. You took {attempts} attempts.")
            break


if __name__ == "__main__":
    guess_number()
