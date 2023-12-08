package main

import (
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestOffset(t *testing.T) {

	targets := []string{"A3", "D3", "F3", "H3"}

	out, err := Offset(targets, 0, 123)
	assert.Nil(t, err)
	assert.Equal(t, []string{"DT3", "DW3", "DY3", "EA3"}, out)

	out, err = Offset(targets, 1, 123)
	assert.Nil(t, err)
	assert.Equal(t, []string{"A126", "D126", "F126", "H126"}, out)
}
