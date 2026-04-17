import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'overview',
      component: () => import('../pages/Overview.vue'),
    },
    {
      path: '/installation',
      name: 'installation',
      component: () => import('../pages/Installation.vue'),
    },
    {
      path: '/foundations/themes',
      name: 'themes',
      component: () => import('../pages/ThemesPage.vue'),
    },
    {
      path: '/components/grid',
      name: 'grid',
      component: () => import('../pages/GridPage.vue'),
    },
    {
      path: '/components/grid-item',
      name: 'grid-item',
      component: () => import('../pages/GridItemPage.vue'),
    },
    {
      path: '/components/flex',
      name: 'flex',
      component: () => import('../pages/FlexPage.vue'),
    },
    {
      path: '/components/flex-item',
      name: 'flex-item',
      component: () => import('../pages/FlexItemPage.vue'),
    },
    {
      path: '/components/stack',
      name: 'stack',
      component: () => import('../pages/StackPage.vue'),
    },
    {
      path: '/components/container',
      name: 'container',
      component: () => import('../pages/ContainerPage.vue'),
    },
    {
      path: '/components/spacer',
      name: 'spacer',
      component: () => import('../pages/SpacerPage.vue'),
    },
    {
      path: '/components/button',
      name: 'button',
      component: () => import('../pages/ButtonPage.vue'),
    },
    {
      path: '/components/button-group',
      name: 'button-group',
      component: () => import('../pages/ButtonGroupPage.vue'),
    },
    {
      path: '/foundations/icons',
      name: 'icons',
      component: () => import('../pages/IconPage.vue'),
    },
    {
      path: '/foundations/colors',
      name: 'colors',
      component: () => import('../pages/ColorsPage.vue'),
    },
    {
      path: '/foundations/typography',
      name: 'typography',
      component: () => import('../pages/TypographyPage.vue'),
    },
    {
      path: '/components/dropdown',
      name: 'dropdown',
      component: () => import('../pages/DropdownPage.vue'),
    },
    {
      path: '/components/pagination',
      name: 'pagination',
      component: () => import('../pages/PaginationPage.vue'),
    },
    {
      path: '/components/breadcrumb',
      name: 'breadcrumb',
      component: () => import('../pages/BreadcrumbPage.vue'),
    },
    {
      path: '/components/card',
      name: 'card',
      component: () => import('../pages/CardPage.vue'),
    },
    {
      path: '/components/tabs',
      name: 'tabs',
      component: () => import('../pages/TabsPage.vue'),
    },
    {
      path: '/components/modal',
      name: 'modal',
      component: () => import('../pages/ModalPage.vue'),
    },
    {
      path: '/components/toast',
      name: 'toast',
      component: () => import('../pages/ToastPage.vue'),
    },
    {
      path: '/components/tooltip',
      name: 'tooltip',
      component: () => import('../pages/TooltipPage.vue'),
    },
    {
      path: '/components/alert',
      name: 'alert',
      component: () => import('../pages/AlertPage.vue'),
    },
    {
      path: '/components/badge',
      name: 'badge',
      component: () => import('../pages/BadgePage.vue'),
    },
    {
      path: '/components/fieldset',
      name: 'fieldset',
      component: () => import('../pages/FieldsetPage.vue'),
    },
    {
      path: '/components/form-field',
      name: 'form-field',
      component: () => import('../pages/FormFieldPage.vue'),
    },
    {
      path: '/components/select',
      name: 'select',
      component: () => import('../pages/SelectPage.vue'),
    },
    {
      path: '/components/textarea',
      name: 'textarea',
      component: () => import('../pages/TextareaPage.vue'),
    },
    {
      path: '/components/masked-input',
      name: 'masked-input',
      component: () => import('../pages/MaskedInputPage.vue'),
    },
    {
      path: '/components/input',
      name: 'input',
      component: () => import('../pages/InputPage.vue'),
    },
    {
      path: '/components/toggle',
      name: 'toggle',
      component: () => import('../pages/TogglePage.vue'),
    },
    {
      path: '/components/checkbox',
      name: 'checkbox',
      component: () => import('../pages/CheckboxPage.vue'),
    },
    {
      path: '/components/radio',
      name: 'radio',
      component: () => import('../pages/RadioPage.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../pages/Overview.vue'),
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
