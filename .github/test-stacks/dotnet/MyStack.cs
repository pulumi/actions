// Copyright 2016-2020, Pulumi Corporation.  All rights reserved.

using System;
using System.Text;
using System.Threading.Tasks;
using Pulumi;
using Pulumi.Random;

class MyStack : Stack
{
    public MyStack()
    {
        var config = new Pulumi.Config();
        var name = config.Require("name");
        var pet = new RandomPet(name, new RandomPetArgs{});

        this.PetName = pet.Id;
    }

    [Output]
    public Output<string> PetName { get; set; }
}
