import * as random from "@pulumi/random";

const pet = new random.RandomPet("hostname");

export const petName = pet.id;
