<script setup lang="ts">
import { CuiButton, CuiNavbar, CuiNavbarNav } from "@itguy614/clean-ui";
import { useTemplateRef } from "vue";

const navbar = useTemplateRef("navbar");
</script>

<template>
  <!-- Skip the built-in button and open the drawer from your own. Hide it from the breakpoint up,
       where the nav is inline; the ! is needed because CuiButton's own display rule beats a layered
       utility class. -->
  <CuiNavbar ref="navbar" :toggle="false">
    <CuiButton class="lg:!hidden" v-bind="navbar?.toggleAttrs" @click="navbar?.toggle()">Menu</CuiButton>
    <CuiNavbarNav>…</CuiNavbarNav>
  </CuiNavbar>
</template>
