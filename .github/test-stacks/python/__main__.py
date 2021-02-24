import pulumi_random as random
from pulumi import export

random_host_name = random.RandomPet("hostname")

export('name', random_host_name.id)
