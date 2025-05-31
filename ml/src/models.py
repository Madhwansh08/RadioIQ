import torch
from torch import nn
from torchvision import models


class CustomResNet50(nn.Module):
    """
    CustomResNet50 is a custom neural network model based on ResNet50 architecture.
    Args:
        num_classes (int): Number of output classes for the final fully connected layer. Default is 2.
    Attributes:
        resnet (torchvision.models.ResNet): Pretrained ResNet50 model with modified fully connected layer.
    """

    def __init__(self, num_classes=2):
        super(CustomResNet50, self).__init__()
        self.resnet = models.resnet50(weights=None)

        for param in self.resnet.parameters():
            param.requires_grad = False

        self.resnet.avgpool = nn.AdaptiveAvgPool2d(output_size=(1, 1))
        self.resnet.fc = nn.Sequential(
            nn.Flatten(),
            nn.Linear(2048, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, num_classes),
        )

    def forward(self, x):
        """
        Defines the forward pass of the network.

        Args:
            x (torch.Tensor): Input tensor.

        Returns:
            torch.Tensor: Output tensor after passing through the network.
        """
        return self.resnet(x)


# Define the Generator Model
class DownSample(nn.Module):
    """Downsampling block using convolutional layer.

    Args:
        Input_Channels (int): Number of input channels.
        Output_Channels (int): Number of output channels.

    Attributes:
        model (nn.Sequential): Sequential container of downsampling layers.
    """

    def __init__(self, Input_Channels, Output_Channels):
        super(DownSample, self).__init__()
        self.model = nn.Sequential(
            nn.Conv2d(Input_Channels, Output_Channels, 4, 2, 1, bias=False),
            nn.LeakyReLU(0.2),
        )

    def forward(self, x):
        """Forward pass of the downsampling block.

        Args:
            x (torch.Tensor): Input tensor.

        Returns:
            torch.Tensor: Downsampled output tensor.
        """
        return self.model(x)


class Upsample(nn.Module):
    """Upsampling block using transposed convolution with skip connections.

    Args:
        Input_Channels (int): Number of input channels.
        Output_Channels (int): Number of output channels.

    Attributes:
        model (nn.Sequential): Sequential container of upsampling layers.
    """

    def __init__(self, Input_Channels, Output_Channels):
        super(Upsample, self).__init__()
        self.model = nn.Sequential(
            nn.ConvTranspose2d(Input_Channels, Output_Channels, 4, 2, 1, bias=False),
            nn.InstanceNorm2d(Output_Channels),
            nn.ReLU(inplace=True),
        )

    def forward(self, x, skip_input):
        """Forward pass of the upsampling block.

        Args:
            x (torch.Tensor): Input tensor to be upsampled.
            skip_input (torch.Tensor): Skip connection input to be concatenated.

        Returns:
            torch.Tensor: Upsampled and concatenated output tensor.
        """
        x = self.model(x)
        x = torch.cat((x, skip_input), 1)
        return x


class ResBlock(nn.Module):
    """Residual block with optional scaling.

    Args:
        filters (int): Number of filters for convolutional layers.
        scaling (float, optional): Scaling factor for the residual connection. Defaults to None.

    Attributes:
        conv1 (nn.Conv2d): First convolutional layer.
        conv2 (nn.Conv2d): Second convolutional layer.
        relu (nn.ReLU): ReLU activation function.
        scaling (float): Scaling factor for the residual connection.
    """

    def __init__(self, filters, scaling=None):
        super(ResBlock, self).__init__()
        self.conv1 = nn.Conv2d(filters, filters, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(filters, filters, kernel_size=3, padding=1)
        self.relu = nn.ReLU(inplace=True)
        self.scaling = scaling

    def forward(self, x):
        """Forward pass of the residual block.

        Args:
            x (torch.Tensor): Input tensor.

        Returns:
            torch.Tensor: Output tensor with residual connection.
        """
        residual = self.conv1(x)
        residual = self.relu(residual)
        residual = self.conv2(residual)
        if self.scaling:
            residual = residual * self.scaling
        return x + residual


# Modified architecture with a dilated convolution block
class ResNetBSHighResDilated(nn.Module):
    """High-resolution ResNet with dilated convolutions for image processing.

    Args:
        img_channels (int, optional): Number of input image channels. Defaults to 1.
        num_filters (int, optional): Number of filters in convolutional layers. Defaults to 64.
        num_res_blocks (int, optional): Number of residual blocks. Defaults to 16.
        res_block_scaling (float, optional): Scaling factor for residual blocks. Defaults to 0.1.

    Attributes:
        downsample (nn.Conv2d): Downsampling convolutional layer.
        dilated_conv (nn.Conv2d): Dilated convolutional layer.
        conv_in (nn.Conv2d): Input convolutional layer.
        res_blocks (nn.ModuleList): List of residual blocks.
        conv_mid (nn.Conv2d): Middle convolutional layer.
        conv_out (nn.Conv2d): Output convolutional layer.
        upsample (nn.ConvTranspose2d): Upsampling transposed convolutional layer.
    """

    def __init__(
        self, img_channels=1, num_filters=64, num_res_blocks=16, res_block_scaling=0.1
    ):
        super(ResNetBSHighResDilated, self).__init__()
        # Downsample 1024x1024 -> 256x256 using a strided convolution
        self.downsample = nn.Conv2d(
            img_channels, img_channels, kernel_size=3, stride=4, padding=1
        )

        # a dilated conv block to increase receptive field further
        self.dilated_conv = nn.Conv2d(
            img_channels, num_filters, kernel_size=3, padding=2, dilation=2
        )

        # Core network
        self.conv_in = nn.Conv2d(num_filters, num_filters, kernel_size=3, padding=1)
        self.res_blocks = nn.ModuleList(
            [ResBlock(num_filters, res_block_scaling) for _ in range(num_res_blocks)]
        )
        self.conv_mid = nn.Conv2d(num_filters, num_filters, kernel_size=3, padding=1)
        self.conv_out = nn.Conv2d(num_filters, num_filters, kernel_size=3, padding=1)

        # Upsample back to 1024x1024 (scale factor 4)
        self.upsample = nn.ConvTranspose2d(
            num_filters, img_channels, kernel_size=4, stride=4, padding=0
        )

    def forward(self, x):
        """Forward pass of the network.

        Args:
            x (torch.Tensor): Input tensor of shape [B, 1, 1024, 1024].

        Returns:
            torch.Tensor: Output tensor of shape [B, 1, 1024, 1024].
        """
        # x: [B, 1, 1024, 1024]
        x_down = self.downsample(x)  # Now [B, 1, 256, 256]
        x_dilated = self.dilated_conv(
            x_down
        )  # Increases receptive field further, output shape [B, num_filters, 256, 256]
        x_in = self.conv_in(x_dilated)
        residual = x_in
        out = x_in

        for res_block in self.res_blocks:
            out = res_block(out)

        out = self.conv_mid(out)
        out = out + residual
        out = self.conv_out(out)
        out = self.upsample(out)  # Back to [B, 1, 1024, 1024]
        return out
