using System.Collections.Generic;
using Pulumi;
using Pulumi.Random;

return await Deployment.RunAsync(() =>
{
    var config = new Config();
    var name = config.Require("name");
    var pet = new RandomPet(name, new()
    {
        Length = 3
    });

    var petName = pet.Id;

    // Export outputs here
    return new Dictionary<string, object?>
    {
        ["petName"] = petName
    };
});
