package main

import (
	random "github.com/pulumi/pulumi-random/sdk/v4/go/random"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		s, err := random.NewRandomString(ctx, "my-user-name", &random.RandomStringArgs{
			Length: pulumi.Int(60),
		})
		if err != nil {
			return err
		}
		ctx.Export("name", s.Result)
		return nil
	})
}
